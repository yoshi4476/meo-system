from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"],
)

class ReviewReply(BaseModel):
    reply_text: str

@router.get("/")
def list_reviews(store_id: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    List reviews from the local database.
    To sync with Google, use /google/sync/{location_id} first.
    """
    query = db.query(models.Review)
    if store_id:
        query = query.filter(models.Review.store_id == store_id)
    return query.order_by(models.Review.create_time.desc()).all()

@router.get("/sync/{store_id}")
def sync_reviews_from_google(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Sync reviews from Google Business Profile to local database.
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
        google_reviews = client.list_reviews(store.google_location_id)
        
        synced_count = 0
        for review_data in google_reviews.get("reviews", []):
            review_id = review_data.get("reviewId") or review_data.get("name", "").split("/")[-1]
            existing = db.query(models.Review).filter(models.Review.google_review_id == review_id).first()
            
            if not existing:
                new_review = models.Review(
                    store_id=store_id,
                    google_review_id=review_id,
                    reviewer_name=review_data.get("reviewer", {}).get("displayName", "Anonymous"),
                    comment=review_data.get("comment"),
                    star_rating=review_data.get("starRating"),
                    reply_comment=review_data.get("reviewReply", {}).get("comment"),
                    create_time=datetime.fromisoformat(review_data.get("createTime", datetime.utcnow().isoformat()).replace("Z", "+00:00")),
                    update_time=datetime.fromisoformat(review_data.get("updateTime", datetime.utcnow().isoformat()).replace("Z", "+00:00")),
                )
                db.add(new_review)
                synced_count += 1
        
        db.commit()
        return {"message": f"Synced {synced_count} new reviews", "total_from_google": len(google_reviews.get("reviews", []))}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{review_id}/reply")
def reply_to_review(review_id: str, reply: ReviewReply, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Reply to a review via Google Business Profile API.
    """
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    store = db.query(models.Store).filter(models.Store.id == review.store_id).first()
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
        review_name = f"{store.google_location_id}/reviews/{review.google_review_id}"
        result = client.reply_to_review(review_name, reply.reply_text)
        
        # Update local record
        review.reply_comment = reply.reply_text
        review.reply_time = datetime.utcnow()
        db.commit()
        
        return {"message": "Reply posted successfully", "reply": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
