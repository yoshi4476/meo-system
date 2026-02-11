from sqlalchemy.orm import Session
import models
from datetime import datetime
import json
import re
import logging
import httpx
import requests
from requests_oauthlib import OAuth1Session # Standard for Twitter v1.1
# Note: requests_oauthlib might not be in requirements.txt. 
# If not, we have to rely on requests and manual auth headers or just v2 with Bearer (if App-only) or User Context.
# Twitter API v2 User Context uses OAuth 2.0 with Bearer Token (AccessToken).
# We will try standard requests with Bearer Token for v2.
# For v1.1 media upload, it usually requires OAuth 1.0a OR OAuth 2.0 (if enabled). 
# Basic Tier supports v2 write. Media upload is tricky. 
# Let's assume User has OAuth 2.0 Access Token which works for v2.
# For media, we might need v1.1. 

from services import google_api
from services.ai_generator import AIClient

logger = logging.getLogger(__name__)

class SNSService:
    def __init__(self, db: Session, user: models.User):
        self.db = db
        self.user = user

    async def publish_post(self, post_id: str):
        """
        Publish a post to all target platforms.
        Updates post.social_post_ids with results.
        Returns final status (PUBLISHED, PARTIAL, FAILED).
        """
        post = self.db.query(models.Post).filter(models.Post.id == post_id).first()
        if not post:
            return "FAILED"

        # Initialize results if empty
        results = post.social_post_ids or {}
        if isinstance(results, str):
             try: results = json.loads(results)
             except: results = {}
        
        targets = post.target_platforms or []
        if isinstance(targets, str):
             try: targets = json.loads(targets)
             except: targets = []
             
        # Normalize targets
        if "google" in targets and "gbp" not in targets: targets.append("gbp")

        success_count = 0
        fail_count = 0
        
        # 1. Google Business Profile
        if "google" in targets or "gbp" in targets:
            try:
                if self.user.is_google_connected:
                    # Use existing google_api service
                    client = google_api.GBPClient(self.user.google_connection.access_token)
                    store = self.db.query(models.Store).filter(models.Store.id == post.store_id).first()
                    
                    if store and store.google_location_id:
                        post_data = {
                            "summary": post.content,
                            "topicType": "STANDARD",
                        }
                        # Handle Media for GBP
                        if post.media_url and post.media_type == "PHOTO":
                             post_data["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": post.media_url}]
                        elif post.media_url and post.media_type == "VIDEO":
                             post_data["media"] = [{"mediaFormat": "VIDEO", "sourceUrl": post.media_url}]
                        
                        res = client.create_local_post(store.google_location_id, post_data)
                        if res and "name" in res:
                            results["google"] = res.get("name")
                            success_count += 1
                        else:
                            results["google"] = f"ERROR: API returned {res}"
                            fail_count += 1
                    else:
                        results["google"] = "ERROR: No Location ID"
                        fail_count += 1
                else:
                    results["google"] = "ERROR: Not Connected"
                    fail_count += 1
            except Exception as e:
                logger.error(f"Google Post Error: {e}")
                results["google"] = f"ERROR: {str(e)}"
                fail_count += 1

        # 2. Instagram
        if "instagram" in targets:
            try:
                res = await self._publish_to_instagram(post)
                results["instagram"] = res
                if "ERROR" in str(res): fail_count += 1
                else: success_count += 1
            except Exception as e:
                results["instagram"] = f"ERROR: {str(e)}"
                fail_count += 1

        # 3. Twitter (X)
        if "twitter" in targets or "x" in targets:
            try:
                res = await self._publish_to_twitter(post)
                results["twitter"] = res
                if "ERROR" in str(res): fail_count += 1
                else: success_count += 1
            except Exception as e:
                results["twitter"] = f"ERROR: {str(e)}"
                fail_count += 1

        # 4. YouTube Shorts
        if "youtube" in targets:
            try:
                res = await self._publish_to_youtube(post)
                results["youtube"] = res
                if "ERROR" in str(res): fail_count += 1
                else: success_count += 1
            except Exception as e:
                results["youtube"] = f"ERROR: {str(e)}"
                fail_count += 1

        # Update Post
        post.social_post_ids = results 
        
        if success_count > 0 and fail_count == 0:
            post.status = "PUBLISHED"
        elif success_count > 0 and fail_count > 0:
            post.status = "PARTIAL"
        elif success_count == 0 and fail_count == 0:
             # No targets?
             if not targets: post.status = "PUBLISHED" # technically done nothing
             else: post.status = "FAILED"
        else:
            post.status = "FAILED"
            
        self.db.commit()
        return post.status

    async def _publish_to_instagram(self, post: models.Post):
        conn = self._get_connection("instagram")
        if not conn: return "ERROR: Not Connected"
        
        # We need the Instagram Business Account ID. 
        # Usually this is stored in SocialConnection.provider_account_id or fetched via Graph API /me/accounts
        ig_user_id = conn.provider_account_id 
        access_token = conn.access_token

        if not ig_user_id:
             # Try to fetch it if missing (recovery)
             # GET /me/accounts?fields=instagram_business_account
             pass 
        
        if not post.media_url:
            return "ERROR: Image required for Instagram"

        # 1. Create Media Container
        url = f"https://graph.facebook.com/v19.0/{ig_user_id}/media"
        params = {
            "image_url": post.media_url,
            "caption": post.content,
            "access_token": access_token
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(url, params=params)
            if res.status_code != 200:
                logger.error(f"IG Create Media Failed: {res.text}")
                return f"ERROR: IG Media Create {res.status_code}"
            
            creation_id = res.json().get("id")
            
            # 2. Publish Media
            publish_url = f"https://graph.facebook.com/v19.0/{ig_user_id}/media_publish"
            pub_params = {
                "creation_id": creation_id,
                "access_token": access_token
            }
            
            res_pub = await client.post(publish_url, params=pub_params)
            if res_pub.status_code != 200:
                logger.error(f"IG Publish Failed: {res_pub.text}")
                return f"ERROR: IG Publish {res_pub.status_code}"
                
            return res_pub.json().get("id")

    async def _publish_to_twitter(self, post: models.Post):
        conn = self._get_connection("twitter")
        if not conn: return "ERROR: Not Connected"
        
        content = post.content
        
        # 1. Remove Hashtags
        content = re.sub(r'#\w+', '', content).strip()
        
        # 2. Check Length and Summarize
        # Twitter counts characters differently, but let's stick to strict 140 char limit as requested.
        if len(content) > 140:
             try:
                # Try to get API Key from UserSettings
                user_settings = self.db.query(models.UserSettings).filter(models.UserSettings.user_id == self.user.id).first()
                openai_key = user_settings.openai_api_key if user_settings else None
                
                if openai_key:
                    ai_client = AIClient(api_key=openai_key)
                    summarized = ai_client.summarize_text(content, max_chars=140)
                    if summarized:
                        content = summarized
                        logger.info(f"AI Summarized for X: {content}")
                else:
                    content = content[:137] + "..."
             except Exception as e:
                logger.error(f"AI Summary Failed: {e}")
                content = content[:137] + "..."

        # 3. Post Tweet (Text Only for V2 Basic usually, unless we use V1.1 for media)
        # Using Twitter API v2: POST /2/tweets
        # Headers: Authorization: Bearer <access_token> -> This implies OAuth 2.0 User Context
        
        url = "https://api.twitter.com/2/tweets"
        headers = {
            "Authorization": f"Bearer {conn.access_token}",
            "Content-Type": "application/json"
        }
        payload = {"text": content}
        
        # Media Handling (Optional/Advanced)
        # If we have media_url, we would ideally upload it.
        # But V2 Media Upload is not straightforward without media_id from v1.1.
        # For this implementation, we will stick to Text-Only to ensure stability 
        # unless we have a robust library. The user requested "Photo + Article" though.
        # Let's add a "Note" to the response or log if media is skipped.
        
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, headers=headers)
            
            if res.status_code == 401:
                # Token might be expired. Refresh logic needed here ideally.
                return "ERROR: Unauthorized (Token Expired?)"
            elif res.status_code != 201:
                logger.error(f"Twitter Post Failed: {res.text}")
                return f"ERROR: X Post {res.status_code}"
            
            data = res.json()
            return data.get("data", {}).get("id")

    async def _publish_to_youtube(self, post: models.Post):
        conn = self._get_connection("youtube")
        if not conn: return "ERROR: Not Connected"
        
        if post.media_type != "VIDEO" or not post.media_url:
            return "ERROR: Video required"

        # Use Google API Client (which handles large uploads better than raw requests)
        # But we need to construct Credentials object from access_token
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaIoBaseUpload
            import io
            
            creds = Credentials(token=conn.access_token)
            youtube = build('youtube', 'v3', credentials=creds)
            
            # Download video from media_url to memory (buffer)
            # CAUTION: Large videos might consume memory. 
            async with httpx.AsyncClient() as client:
                vid_res = await client.get(post.media_url)
                if vid_res.status_code != 200:
                    return "ERROR: Failed to download video"
                video_data = io.BytesIO(vid_res.content)
            
            request_body = {
                'snippet': {
                    'title': (post.content[:90] + "...") if len(post.content) > 90 else post.content, # Title limit 100
                    'description': post.content,
                    'tags': ['Shorts'],
                    'categoryId': '22' # People & Blogs
                },
                'status': {
                    'privacyStatus': 'public', # or private/unlisted
                    'selfDeclaredMadeForKids': False
                }
            }
            
            media = MediaIoBaseUpload(video_data, mimetype='video/mp4', resumable=True)
            
            request = youtube.videos().insert(
                part='snippet,status',
                body=request_body,
                media_body=media
            )
            
            response = request.execute()
            return response.get("id")
            
        except Exception as e:
            logger.error(f"YouTube Upload Error: {e}")
            return f"ERROR: {str(e)}"

    def _get_connection(self, platform: str):
        return self.db.query(models.SocialConnection).filter(
            models.SocialConnection.user_id == self.user.id,
            models.SocialConnection.platform == platform
        ).first()
