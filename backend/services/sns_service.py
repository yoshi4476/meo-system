from sqlalchemy.orm import Session
import models
from datetime import datetime
import json
import re
import logging

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
        
        # 1. Google Business Profile (Existing Logic)
        if "google" in targets or "gbp" in targets:
            try:
                # Delegate to existing logic via Google API Service or local code
                # For now, let's assume we call a helper or use the existing logic in router
                # But ideally, service handles it.
                # Simplification: We will mark it as PENDING_GOOGLE if not handled here, 
                # but let's try to handle it if we have the connection.
                
                if self.user.is_google_connected:
                    from services import google_api
                    client = google_api.GBPClient(self.user.google_connection.access_token)
                    store = self.db.query(models.Store).filter(models.Store.id == post.store_id).first()
                    
                    if store and store.google_location_id:
                        post_data = {
                            "summary": post.content,
                            "topicType": "STANDARD",
                        }
                        if post.media_url and post.media_type == "PHOTO":
                             post_data["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": post.media_url}]
                        
                        res = client.create_local_post(store.google_location_id, post_data)
                        results["google"] = res.get("name")
                        success_count += 1
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
            res = await self._publish_to_instagram(post)
            results["instagram"] = res
            if "ERROR" in str(res): fail_count += 1
            else: success_count += 1

        # 3. Twitter (X)
        if "twitter" in targets or "x" in targets:
            res = await self._publish_to_twitter(post)
            results["twitter"] = res
            if "ERROR" in str(res): fail_count += 1
            else: success_count += 1

        # 4. YouTube Shorts
        if "youtube" in targets:
            res = await self._publish_to_youtube(post)
            results["youtube"] = res
            if "ERROR" in str(res): fail_count += 1
            else: success_count += 1

        # Update Post
        post.social_post_ids = results # SQLAlchemy handles JSON casting if defined as JSON type
        
        if success_count > 0 and fail_count == 0:
            post.status = "PUBLISHED"
        elif success_count > 0 and fail_count > 0:
            post.status = "PARTIAL"
        else:
            post.status = "FAILED"
            
        self.db.commit()
        return post.status

    async def _publish_to_instagram(self, post: models.Post):
        conn = self._get_connection("instagram")
        if not conn: return "ERROR: Not Connected"
        
        # Mock Implementation for now
        # Real impl needs:
        # 1. Create Media Container (POST /me/media)
        # 2. Publish Container (POST /me/media_publish)
        return "mock_ig_media_id_123"

    async def _publish_to_twitter(self, post: models.Post):
        conn = self._get_connection("twitter")
        if not conn: return "ERROR: Not Connected"
        
        content = post.content
        
        # 1. Remove Hashtags
        content = re.sub(r'#\w+', '', content).strip()
        
        # 2. Check Length (140 chars for Japanese roughly)
        if len(content) > 140:
            # AI Summarization
            try:
                from services import ai_generator
                
                # Try to get API Key from UserSettings
                user_settings = self.db.query(models.UserSettings).filter(models.UserSettings.user_id == self.user.id).first()
                api_key = user_settings.openai_api_key if user_settings else None
                
                if api_key:
                    ai_client = ai_generator.AIClient(api_key=api_key)
                    summarized = ai_client.summarize_text(content, max_chars=140)
                    if summarized:
                        content = summarized
                        logger.info(f"AI Summarized content for Twitter: {content}")
                else:
                    # Fallback truncation if no API key
                    content = content[:137] + "..."
            except Exception as e:
                logger.error(f"AI Summary failed: {e}")
                content = content[:137] + "..."
        
        # Mock Implementation
        return "mock_tweet_id_456"

    async def _publish_to_youtube(self, post: models.Post):
        conn = self._get_connection("youtube")
        if not conn: return "ERROR: Not Connected"
        
        if post.media_type != "VIDEO":
            return "ERROR: Video required for YouTube"
            
        # Mock Implementation
        return "mock_yt_video_id_789"

    def _get_connection(self, platform: str):
        return self.db.query(models.SocialConnection).filter(
            models.SocialConnection.user_id == self.user.id,
            models.SocialConnection.platform == platform
        ).first()
