from sqlalchemy.orm import Session
import models
from datetime import datetime
import json
import re
import logging
import httpx
import requests
import uuid
import os
try:
    from requests_oauthlib import OAuth1Session # Twitter v1.1用
except ImportError:
    OAuth1Session = None
    print("WARNING: requests_oauthlib not found. Twitter v1.1 features will be disabled.")

from services import google_api
from services.ai_generator import AIClient

logger = logging.getLogger(__name__)

class SNSService:
    def __init__(self, db: Session, user: models.User):
        self.db = db
        self.user = user

    def _resolve_media_url(self, media_url: str) -> str:
        """
        メディアURLを解決する。
        - localhost URL → エラーを投げる
        - googleusercontent.com URL → 画像をダウンロードしてimgbbにアップロード
        - その他 → そのまま返す
        
        注意: Renderのエフェメラルストレージは外部からアクセスできないため、
        外部画像ホスティングサービスを使用する。
        """
        if not media_url:
            return media_url
            
        # localhost/プライベートIPチェック
        if "localhost" in media_url or "127.0.0.1" in media_url:
            raise ValueError("ローカル環境(localhost)の画像はGoogleに送信できません。公開URLを使用するか、本番環境で実行してください。")
        
        # Google CDN画像 → ダウンロードして外部ホストにアップロード
        if "googleusercontent.com" in media_url:
            logger.info(f"Google画像を外部ホストに転送中: {media_url}")
            
            # サイズ制限を解除 (=s300 → =s0 でオリジナルサイズ)
            import re
            clean_url = re.sub(r'=s\d+$', '=s0', media_url)
            clean_url = re.sub(r'=w\d+-h\d+$', '=s0', clean_url)
            
            # Google画像をダウンロード
            img_res = requests.get(clean_url, timeout=15)
            if not img_res.ok:
                raise ValueError(f"Google画像のダウンロードに失敗しました (HTTP {img_res.status_code})")
            
            import base64
            img_b64 = base64.b64encode(img_res.content).decode("utf-8")
            
            # imgbb.comにアップロード（無料API、APIキー不要の匿名アップロード）
            # フリーAPIキー: imgbbでは匿名アップロードにもキーが必要だが、
            # 代わりにfreeimage.hostを使用（APIキー不要）
            try:
                upload_res = requests.post(
                    "https://freeimage.host/api/1/upload",
                    data={
                        "key": "6d207e02198a847aa98d0a2a901485a5",  # freeimage.host公開APIキー
                        "action": "upload",
                        "source": img_b64,
                        "format": "json"
                    },
                    timeout=30
                )
                
                if upload_res.ok:
                    upload_data = upload_res.json()
                    if upload_data.get("status_code") == 200:
                        hosted_url = upload_data.get("image", {}).get("url", "")
                        if hosted_url:
                            logger.info(f"画像アップロード成功: {hosted_url}")
                            return hosted_url
                
                # freeimage.hostが失敗した場合、imgbb.comを試す
                logger.warning(f"freeimage.host失敗、imgbbを試行: {upload_res.text[:200]}")
            except Exception as e:
                logger.warning(f"freeimage.host例外: {e}")
            
            # フォールバック: imgbb.com 
            try:
                upload_res2 = requests.post(
                    "https://api.imgbb.com/1/upload",
                    data={
                        "key": "a9a3ac4de788d35e5e5e6c08cb5a7548",  # imgbb無料APIキー
                        "image": img_b64,
                    },
                    timeout=30
                )
                
                if upload_res2.ok:
                    upload_data2 = upload_res2.json()
                    if upload_data2.get("success"):
                        hosted_url2 = upload_data2.get("data", {}).get("url", "")
                        if hosted_url2:
                            logger.info(f"imgbbアップロード成功: {hosted_url2}")
                            return hosted_url2
                
                logger.error(f"imgbb失敗: {upload_res2.text[:200]}")
            except Exception as e2:
                logger.error(f"imgbb例外: {e2}")
            
            # 両方失敗した場合、修正済みURLで最後の試みをする
            logger.warning("外部ホスト全失敗、修正GoogleURLで直接試行")
            return clean_url
        
        # 通常のURLはそのまま
        return media_url

    async def publish_post(self, post_id: str):
        """
        投稿を全ターゲットプラットフォームに公開する。
        post.social_post_idsに結果を保存する。
        最終ステータス (PUBLISHED, PARTIAL, FAILED) を返す。
        """
        post = self.db.query(models.Post).filter(models.Post.id == post_id).first()
        if not post:
            return "FAILED"

        # 結果を初期化
        results = post.social_post_ids or {}
        if isinstance(results, str):
             try: results = json.loads(results)
             except: results = {}
        
        targets = post.target_platforms or []
        if isinstance(targets, str):
             try: targets = json.loads(targets)
             except: targets = []
             
        # ターゲットの正規化
        if "google" in targets and "gbp" not in targets: targets.append("gbp")

        success_count = 0
        fail_count = 0
        
        # 1. Google Business Profile
        if "google" in targets or "gbp" in targets:
            try:
                if not self.user.is_google_connected:
                    raise ValueError("Googleアカウントが未接続です")
                
                client = google_api.GBPClient(self.user.google_connection.access_token)
                store = self.db.query(models.Store).filter(models.Store.id == post.store_id).first()
                
                if not store or not store.google_location_id:
                    raise ValueError("Location IDが設定されていません")
                
                # 投稿データ構築
                post_data = {
                    "summary": post.content,
                    "topicType": "STANDARD",
                }
                
                # メディア処理
                if post.media_url:
                    resolved_url = self._resolve_media_url(post.media_url)
                    media_format = post.media_type if post.media_type in ("PHOTO", "VIDEO") else "PHOTO"
                    post_data["media"] = [{"mediaFormat": media_format, "sourceUrl": resolved_url}]
                
                # API呼び出し
                res = client.create_local_post(store.google_location_id, post_data)
                
                if res and "name" in res:
                    results["google"] = {
                        "id": res.get("name"),
                        "searchUrl": res.get("searchUrl")
                    }
                    logger.info(f"Google Post Success: {res.get('searchUrl')}")
                    success_count += 1
                else:
                    results["google"] = f"ERROR: APIレスポンスが不正: {res}"
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
        # Reserve space for Media URL (23 chars for t.co) + space = 24 chars
        max_chars = 140
        if post.media_url:
            max_chars = 115
            
        if len(content) > max_chars:
             try:
                # Try to get API Key from UserSettings
                user_settings = self.db.query(models.UserSettings).filter(models.UserSettings.user_id == self.user.id).first()
                openai_key = user_settings.openai_api_key if user_settings else None
                
                if openai_key:
                    ai_client = AIClient(api_key=openai_key)
                    summarized = ai_client.summarize_text(content, max_chars=max_chars)
                    if summarized:
                        content = summarized
                        logger.info(f"AI Summarized for X: {content}")
                else:
                    content = content[:(max_chars-3)] + "..."
             except Exception as e:
                logger.error(f"AI Summary Failed: {e}")
                content = content[:(max_chars-3)] + "..."

        # Append Media URL if exists
        if post.media_url:
            content += f" {post.media_url}"

        # 3. Post Tweet (Text Only for V2 Basic usually, unless we use V1.1 for media)
        # Using Twitter API v2: POST /2/tweets
        # Headers: Authorization: Bearer <access_token> -> This implies OAuth 2.0 User Context
        
        url = "https://api.twitter.com/2/tweets"
        headers = {
            "Authorization": f"Bearer {conn.access_token}",
            "Content-Type": "application/json"
        }
        payload = {"text": content}
        
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
