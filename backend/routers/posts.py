from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth, schemas
from services import google_api
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(
    prefix="/posts",
    tags=["posts"],
)

class PostCreate(BaseModel):
    store_id: str
    content: str
    media_url: Optional[str] = None
    media_type: str = "PHOTO" # PHOTO, VIDEO
    status: str = "DRAFT" # DRAFT, SCHEDULED, PUBLISHED
    scheduled_at: Optional[datetime] = None
    target_platforms: List[str] = ["google"] # google, instagram, twitter, youtube

class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    target_platforms: Optional[List[str]] = None

@router.get("/")
def list_posts(store_id: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Post)
    if store_id:
        query = query.filter(models.Post.store_id == store_id)
    return query.order_by(models.Post.created_at.desc()).all()

@router.post("/")
async def create_post(post: PostCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify store access (simplified)
    store = db.query(models.Store).filter(models.Store.id == post.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    db_post = models.Post(
        store_id=post.store_id,
        content=post.content,
        media_url=post.media_url,
        media_type=post.media_type,
        status=post.status,
        scheduled_at=post.scheduled_at,
        target_platforms=post.target_platforms
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    # If status is PUBLISHED (Immediate Post), trigger publish
    if db_post.status == 'PUBLISHED':
        from services.sns_service import SNSService
        service = SNSService(db, current_user)
        try:
            await service.publish_post(db_post.id)
            db.refresh(db_post)
        except Exception as e:
            print(f"Publish Error: {e}")

    return db_post

@router.get("/{post_id}")
def get_post(post_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.patch("/{post_id}")
def update_post(post_id: str, post_update: PostUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post_update.content is not None:
        post.content = post_update.content
    if post_update.media_url is not None:
        post.media_url = post_update.media_url
    if post_update.status is not None:
        post.status = post_update.status
    if post_update.scheduled_at is not None:
        post.scheduled_at = post_update.scheduled_at
    
    db.commit()
    db.refresh(post)
    
    # Sync update to Google if published
    if post.status == 'PUBLISHED' and post.google_post_id and current_user.google_connection:
        try:
             # Refresh token if needed
             connection = current_user.google_connection
             if connection.expiry and connection.expiry < datetime.utcnow() and connection.refresh_token:
                 new_tokens = google_api.refresh_access_token(connection.refresh_token)
                 connection.access_token = new_tokens.get("access_token")
                 connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
                 db.commit()
                 
             client = google_api.GBPClient(connection.access_token)
             
             # Prepare Update Data
             post_data = {
                 "summary": post.content,
                 "topicType": "STANDARD",
             }
             if post.media_url:
                 post_data["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": post.media_url}]
                 
             client.update_local_post(post.google_post_id, post_data)
             print(f"DEBUG: Updated post {post.google_post_id} on Google")
             
        except Exception as e:
             print(f"Warning: Failed to sync post update to Google: {e}")
             # Non-fatal for local update
    
    return post

@router.delete("/{post_id}")
def delete_post(post_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Try to delete from Google if it was published
    # Try to delete from Google if it was published
    if post.status == 'PUBLISHED' and post.google_post_id:
        # STRICT CHECK: Connection required
        if not current_user.google_connection:
             raise HTTPException(status_code=400, detail="Google連携が切断されているため、投稿を削除できません。設定画面から再接続してください。")

        connection = current_user.google_connection
        # Refresh Token Logic
        if connection.expiry and connection.expiry < datetime.utcnow() and connection.refresh_token:
             try:
                 new_tokens = google_api.refresh_access_token(connection.refresh_token)
                 connection.access_token = new_tokens.get("access_token")
                 connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
                 db.commit()
             except Exception as e:
                 print(f"Failed to refresh token: {e}")
                 raise HTTPException(status_code=401, detail="Google認証の更新に失敗しました。再ログインしてください。")

        client = google_api.GBPClient(connection.access_token)
        
        # Get Location ID
        store = db.query(models.Store).filter(models.Store.id == post.store_id).first()
        location_id = store.google_location_id if store else None

        try:
             client.delete_local_post(post.google_post_id, location_name=location_id)
             print(f"DEBUG: Successfully deleted post {post.google_post_id} from Google")
        except Exception as e:
             # Handle 404 (Already deleted on Google) -> Allow local delete
             if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
                 print(f"DEBUG: Post already deleted on Google (404). Proceeding with local delete.")
             else:
                 # Any other error -> BLOCK local delete
                 print(f"Error deleting from Google: {e}")
                 raise HTTPException(status_code=500, detail="Google側での削除に失敗しました。時間をおいて再試行するか、Googleマップで直接削除してください。")

    # Always delete from local DB
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}

@router.post("/{post_id}/publish")
async def publish_post(post_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Publish a post to all target platforms (Google, SNS).
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Store check
    store = db.query(models.Store).filter(models.Store.id == post.store_id).first()
    if not store:
         raise HTTPException(status_code=404, detail="Store not found")
         
    # Use SNS Service
    from services.sns_service import SNSService
    service = SNSService(db, current_user)
    
    try:
        final_status = await service.publish_post(post_id)
        return {"message": f"Post publish process completed. Status: {final_status}", "status": final_status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sync/{store_id}")
def sync_posts_from_google(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Sync posts from Google Business Profile to local database.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store or not store.google_location_id:
        raise HTTPException(status_code=400, detail="Store not linked to Google Business Profile")
    
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    # Refresh token if needed
    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()
    
    client = google_api.GBPClient(connection.access_token)
    try:
        google_posts = client.list_local_posts(store.google_location_id)
        
        synced_count = 0
        for post_data in google_posts.get("localPosts", []):
            # Parse Google Post Data
            # Note: Google doesn't always provide a clean creation time in v4 API listing
            # We'll use createTime if available, or current time if new
            create_time_str = post_data.get("createTime") or post_data.get("updateTime")
            created_at = datetime.utcnow()
            if create_time_str:
                try:
                    created_at = datetime.fromisoformat(create_time_str.replace("Z", "+00:00"))
                except:
                    pass

            # In v4 API, post ID is part of the name "accounts/.../locations/.../localPosts/{id}"
            post_name = post_data.get("name")
            
            # Check for existence by checking content match or we need a google_post_id column
            # For now, let's use content + created_at similarity or just simple content match
            # Ideally we should add `google_post_id` to Post model
            
            # Simplified: Syncing only NEW posts if we can't key by ID easily without migration
            # Actually, let's check content match for "DRAFT" or "PUBLISHED"
            
            summary = post_data.get("summary", "")
            
            # Add new post if not exists?
            # Without a google_post_id column, we risk duplicates. 
            # But the user asked for sync.
            # I will create a new post if no post with same content exists for this store.
            
            # Check for existence 
            existing = db.query(models.Post).filter(
                models.Post.store_id == store_id, 
                models.Post.content == summary
            ).first()
            
            if existing:
                # Update existing post with Google ID if missing
                if not existing.google_post_id:
                    existing.google_post_id = post_name
                if existing.status != 'PUBLISHED':
                     existing.status = 'PUBLISHED'
                # Update scheduled/created time if needed? 
                # Ideally we respect local, but for sync, Google is truth.
                synced_count += 0 # It's an update, technically
            else:
                media_url = None
                if post_data.get("media"):
                    media_url = post_data.get("media")[0].get("sourceUrl")
                
                new_post = models.Post(
                    store_id=store_id,
                    content=summary,
                    media_url=media_url,
                    status="PUBLISHED",
                    created_at=created_at,
                    google_post_id=post_name
                )
                db.add(new_post)
                synced_count += 1
        
        db.commit()
        return {"message": f"Synced {synced_count} new posts (and updated existing links)", "total_google": len(google_posts.get("localPosts", []))}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
