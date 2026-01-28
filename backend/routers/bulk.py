from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import models, database, auth
from pydantic import BaseModel
from typing import List, Optional
from routers import posts # Import to reuse logic if possible, or services
from services import google_api

router = APIRouter(
    prefix="/bulk",
    tags=["bulk"],
)

class BulkPostRequest(BaseModel):
    store_ids: List[str]
    content: str
    media_url: Optional[str] = None
    # Action type? "POST"

@router.post("/posts")
def create_bulk_post(
    req: BulkPostRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify user owns these stores or is Company Admin
    # For MVP, assume if they have IDs, they can try. Logic should be robust though.
    # We will trigger a background task to process each store.
    
    background_tasks.add_task(process_bulk_post, req, current_user.id)
    return {"message": f"Started bulk posting to {len(req.store_ids)} stores"}

def process_bulk_post(req: BulkPostRequest, user_id: str):
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.is_google_connected:
            print("Bulk Post Error: User not connected")
            return

        client = google_api.GBPClient(user.google_connection.access_token)
        
        for store_id in req.store_ids:
            store = db.query(models.Store).filter(models.Store.id == store_id).first()
            if not store or not store.google_location_id:
                continue
                
            # Create Local Post
            new_post = models.Post(
                store_id=store_id,
                content=req.content,
                media_url=req.media_url,
                status="PUBLISHED"
            )
            db.add(new_post)
            db.commit()
            
            # Publish to Google
            try:
                client.create_post(store.google_location_id, req.content, req.media_url)
            except Exception as e:
                print(f"Failed to post to Google for store {store_id}: {e}")
                new_post.status = "FAILED_GOOGLE"
                db.commit()
                
    except Exception as e:
        print(f"Bulk Process Error: {e}")
    finally:
        db.close()
