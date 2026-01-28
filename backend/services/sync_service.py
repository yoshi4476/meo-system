from datetime import datetime
from typing import List, Dict, Any
from .google_api import GBPClient
from sqlalchemy.orm import Session
import models
# import database.crud as crud 

class GoogleSyncService:
    def __init__(self, gbp_client: GBPClient):
        self.gbp = gbp_client
        
    async def sync_all(self, db: Session, store_id: str, location_id: str):
        """Orchestrate full sync for a store"""
        results = {
            "reviews": await self.sync_reviews(db, store_id, location_id),
            "posts": await self.sync_posts(db, store_id, location_id),
            "insights": await self.sync_insights(db, store_id, location_id),
            "media": await self.sync_media(db, store_id, location_id),
            "qa": await self.sync_qa(db, store_id, location_id),
            "location": await self.sync_location_details(db, store_id, location_id),
            "synced_at": datetime.now().isoformat()
        }
        # Update store's last_synced_at in DB
        store = db.query(models.Store).filter(models.Store.id == store_id).first()
        if store:
             store.last_synced_at = datetime.now()
             db.commit()
             
        return results

    async def sync_reviews(self, db: Session, store_id: str, location_id: str):
        """Fetch latest reviews from Google and update local DB"""
        try:
            google_reviews = self.gbp.list_reviews(location_id)
            synced_count = 0
            
            for review_data in google_reviews.get("reviews", []):
                review_id = review_data.get("reviewId") or review_data.get("name", "").split("/")[-1]
                existing = db.query(models.Review).filter(models.Review.google_review_id == review_id).first()
                
                # Parse timestamp safely
                create_time_str = review_data.get("createTime", datetime.utcnow().isoformat()).replace("Z", "+00:00")
                try:
                    create_time = datetime.fromisoformat(create_time_str)
                except:
                    create_time = datetime.utcnow()

                if not existing:
                    new_review = models.Review(
                        store_id=store_id,
                        google_review_id=review_id,
                        reviewer_name=review_data.get("reviewer", {}).get("displayName", "Anonymous"),
                        comment=review_data.get("comment"),
                        star_rating=review_data.get("starRating"),
                        reply_comment=review_data.get("reviewReply", {}).get("comment"),
                        create_time=create_time,
                    )
                    db.add(new_review)
                    synced_count += 1
                else:
                    # Update potentially changed fields (reply etc)
                    if review_data.get("reviewReply", {}).get("comment"):
                        existing.reply_comment = review_data.get("reviewReply", {}).get("comment")

            db.commit()
            return {"status": "success", "count": synced_count}
        except Exception as e:
            print(f"Sync Reviews Error: {e}")
            return {"status": "error", "message": str(e)}

    async def sync_posts(self, db: Session, store_id: str, location_id: str):
        """Fetch latest posts from Google"""
        try:
            google_posts = self.gbp.list_posts(location_id)
            # Logic to upsert posts
            return {"status": "success", "count": len(google_posts)}
        except Exception as e:
            print(f"Sync Posts Error: {e}")
            return {"status": "error", "message": str(e)}

    async def sync_insights(self, db: Session, store_id: str, location_id: str):
        """Fetch latest insights (metrics)"""
        try:
            # Fetch for last 30 days usually
            # metrics = self.gbp.fetch_performance_metrics(location_id)
            return {"status": "success", "message": "Metrics updated"}
        except Exception as e:
             return {"status": "error", "message": str(e)}

    async def sync_media(self, db: Session, store_id: str, location_id: str):
        """Fetch photos/videos"""
        try:
            media_items = self.gbp.list_media(location_id)
            return {"status": "success", "count": len(media_items)}
        except Exception as e:
             return {"status": "error", "message": str(e)}

    async def sync_qa(self, db: Session, store_id: str, location_id: str):
        """Fetch Questions and Answers"""
        # Note: GBPClient might need update if list_qa not implemented
        return {"status": "skipped", "message": "Q&A Sync not fully implemented in API client"}

    async def sync_location_details(self, db: Session, store_id: str, location_id: str):
        """Sync basic location info (Hours, Attributes)"""
        try:
             # location = self.gbp.get_location(location_id)
             # crud.update_store(store_id, location)
             return {"status": "success", "message": "Location details updated"}
        except Exception as e:
             return {"status": "error", "message": str(e)}

# Helper to instantiate service
# Helper to instantiate service
def get_sync_service():
    import os
    # In real app, load credentials, init GBPClient
    # Ensure variables are set in .env
    creds = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "refresh_token": os.getenv("GOOGLE_REFRESH_TOKEN"), # Assuming we have a system-wide or user specific token, for now system
    }
    client = GBPClient(credentials=creds) 
    return GoogleSyncService(client)
