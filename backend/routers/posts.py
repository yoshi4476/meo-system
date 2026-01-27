from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth, schemas
from services import google_api
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/posts",
    tags=["posts"],
)

class PostCreate(BaseModel):
    store_id: str
    content: str
    media_url: Optional[str] = None
    status: str = "DRAFT" # DRAFT, SCHEDULED, PUBLISHED
    scheduled_at: Optional[datetime] = None

class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None

@router.get("/")
def list_posts(store_id: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Post)
    if store_id:
        query = query.filter(models.Post.store_id == store_id)
    return query.order_by(models.Post.created_at.desc()).all()

@router.post("/")
def create_post(post: PostCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify store access (simplified)
    store = db.query(models.Store).filter(models.Store.id == post.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    db_post = models.Post(
        store_id=post.store_id,
        content=post.content,
        media_url=post.media_url,
        status=post.status,
        scheduled_at=post.scheduled_at
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
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
    return post

@router.delete("/{post_id}")
def delete_post(post_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}

@router.post("/{post_id}/publish")
def publish_post(post_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Publish a post to Google Business Profile.
    Requires Google connection.
    """
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    store = db.query(models.Store).filter(models.Store.id == post.store_id).first()
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
        post_data = {
            "summary": post.content,
            "topicType": "STANDARD",
        }
        if post.media_url:
            post_data["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": post.media_url}]
        
        result = client.create_local_post(store.google_location_id, post_data)
        
        # Update post status
        post.status = "PUBLISHED"
        db.commit()
        
        return {"message": "Post published successfully", "google_post_id": result.get("name")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
