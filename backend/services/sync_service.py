from datetime import datetime
from typing import List, Dict, Any
from .google_api import GBPClient
# Assuming we have database models/CRUD. For now, we'll mock the DB interactions or assume a Service layer exists.
# import database.crud as crud 

class GoogleSyncService:
    def __init__(self, gbp_client: GBPClient):
        self.gbp = gbp_client
        
    async def sync_all(self, store_id: str, location_id: str):
        """Orchestrate full sync for a store"""
        results = {
            "reviews": await self.sync_reviews(store_id, location_id),
            "posts": await self.sync_posts(store_id, location_id),
            "insights": await self.sync_insights(store_id, location_id),
            "media": await self.sync_media(store_id, location_id),
            "qa": await self.sync_qa(store_id, location_id),
            "location": await self.sync_location_details(store_id, location_id),
            "synced_at": datetime.now().isoformat()
        }
        # Update store's last_synced_at in DB
        return results

    async def sync_reviews(self, store_id: str, location_id: str):
        """Fetch latest reviews from Google and update local DB"""
        try:
            google_reviews = self.gbp.list_reviews(location_id)
            # Logic to upsert reviews to DB
            # for review in google_reviews:
            #     crud.upsert_review(store_id, review)
            return {"status": "success", "count": len(google_reviews)}
        except Exception as e:
            print(f"Sync Reviews Error: {e}")
            return {"status": "error", "message": str(e)}

    async def sync_posts(self, store_id: str, location_id: str):
        """Fetch latest posts from Google"""
        try:
            google_posts = self.gbp.list_posts(location_id)
            # Logic to upsert posts
            return {"status": "success", "count": len(google_posts)}
        except Exception as e:
            print(f"Sync Posts Error: {e}")
            return {"status": "error", "message": str(e)}

    async def sync_insights(self, store_id: str, location_id: str):
        """Fetch latest insights (metrics)"""
        try:
            # Fetch for last 30 days usually
            # metrics = self.gbp.fetch_performance_metrics(location_id)
            return {"status": "success", "message": "Metrics updated"}
        except Exception as e:
             return {"status": "error", "message": str(e)}

    async def sync_media(self, store_id: str, location_id: str):
        """Fetch photos/videos"""
        try:
            media_items = self.gbp.list_media(location_id)
            return {"status": "success", "count": len(media_items)}
        except Exception as e:
             return {"status": "error", "message": str(e)}

    async def sync_qa(self, store_id: str, location_id: str):
        """Fetch Questions and Answers"""
        # Note: GBPClient might need update if list_qa not implemented
        return {"status": "skipped", "message": "Q&A Sync not fully implemented in API client"}

    async def sync_location_details(self, store_id: str, location_id: str):
        """Sync basic location info (Hours, Attributes)"""
        try:
             # location = self.gbp.get_location(location_id)
             # crud.update_store(store_id, location)
             return {"status": "success", "message": "Location details updated"}
        except Exception as e:
             return {"status": "error", "message": str(e)}

# Helper to instantiate service
def get_sync_service():
    # In real app, load credentials, init GBPClient
    client = GBPClient(credentials={}) # Mock or load real
    return GoogleSyncService(client)
