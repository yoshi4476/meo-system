from datetime import datetime, timedelta
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
        
        # Resolve v4 name (accounts/{accountId}/locations/{locationId})
        # location_id from DB is strictly 'locations/XXX' (v1 format)
        
        v4_location_name = None
        resolve_error = None
        
        try:
            accounts_data = self.gbp.list_accounts()
            if accounts_data.get("accounts"):
                # Use the first account. 
                # Ideally check which account actually owns the location but listing all locations per account is expensive.
                # Assuming the authorized user has access via the first account returned.
                account_name = accounts_data["accounts"][0]["name"] # accounts/123...
                location_suffix = location_id.split("/")[-1]
                v4_location_name = f"{account_name}/locations/{location_suffix}"
            else:
                 resolve_error = "No Google Accounts found for this user."
        except Exception as e:
            resolve_error = f"Failed to list accounts: {e}"
            
        # If we couldn't resolve v4 name, we cannot proceed with v4 APIs (Reviews, Posts, Media, QA)
        if not v4_location_name:
             # We can still sync Insights/Location which use v1 (location_id)
             print(f"Warning: {resolve_error}. Skipping v4 dependent syncs.")
             # But we should probably alert the user?
             # For now, let's try to proceed with v1 only, or fail?
             # User expects Reviews. If we can't get reviews, we should error.
             if resolve_error:
                 return {"status": "error", "message": f"Google Account ID Resolution Failed: {resolve_error}"}
             return {"status": "error", "message": "Google Account ID not found."}
        
        results = {
            "reviews": await self.sync_reviews(db, store_id, v4_location_name),
            "posts": await self.sync_posts(db, store_id, v4_location_name),
            "insights": await self.sync_insights(db, store_id, location_id), # Insights uses v1 (locations/XXX)
            "media": await self.sync_media(db, store_id, v4_location_name),
            "qa": await self.sync_qa(db, store_id, v4_location_name),
            "location": await self.sync_location_details(db, store_id, location_id), # Business Info uses v1
            "synced_at": datetime.now().isoformat()
        }
        
        # Update store's last_synced_at in DB
        store = db.query(models.Store).filter(models.Store.id == store_id).first()
        if store:
             store.last_synced_at = datetime.utcnow()
             db.commit()
             
        return results

    async def sync_reviews(self, db: Session, store_id: str, location_id: str):
        """Fetch latest reviews from Google and update local DB"""
        try:
            google_reviews = self.gbp.list_reviews(location_id)
            synced_count = 0
            
            # Handle empty response
            if not google_reviews or not google_reviews.get("reviews"):
                return {"status": "success", "count": 0, "message": "No reviews found"}
            
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

            return {"status": "success", "count": synced_count}
        except Exception as e:
            error_msg = str(e)
            print(f"Sync Reviews Error: {error_msg}")
            if "403" in error_msg and "Forbidden" in error_msg:
                 return {"status": "error", "message": "Google My Business API (Classic) not enabled. Please enable it in Cloud Console."}
            # Check if it's a 404 (no reviews exist) - treat as success
            if "404" in error_msg or "Not Found" in error_msg:
                return {"status": "success", "count": 0, "message": "No reviews on GBP yet"}
            return {"status": "error", "message": error_msg}

    async def sync_posts(self, db: Session, store_id: str, location_id: str):
        """Fetch latest posts from Google"""
        try:
            google_posts = self.gbp.list_local_posts(location_id)
            synced_count = 0
            
            # Handle empty response
            if not google_posts or not google_posts.get("localPosts"):
                return {"status": "success", "count": 0, "message": "No posts found"}
            
            for post_data in google_posts.get("localPosts", []):
                content = post_data.get("summary", "")
                
                # Check duplication by content match
                existing = db.query(models.Post).filter(models.Post.store_id == store_id, models.Post.content == content).first()

                if not existing and content:
                    create_time_str = post_data.get("createTime", datetime.utcnow().isoformat()).replace("Z", "+00:00")
                    try:
                        create_time = datetime.fromisoformat(create_time_str)
                    except:
                        create_time = datetime.utcnow()

                    new_post = models.Post(
                        store_id=store_id,
                        content=content,
                        status="PUBLISHED",
                        created_at=create_time,
                    )
                    
                    media_list = post_data.get("media", [])
                    if media_list:
                         new_post.media_url = media_list[0].get("sourceUrl")

                    db.add(new_post)
                    synced_count += 1
            
            db.commit()
            return {"status": "success", "count": synced_count}
        except Exception as e:
            error_msg = str(e)
            print(f"Sync Posts Error: {error_msg}")
            if "403" in error_msg and "Forbidden" in error_msg:
                 return {"status": "error", "message": "Google My Business API (Classic) not enabled."}
            if "404" in error_msg or "Not Found" in error_msg:
                return {"status": "success", "count": 0, "message": "No posts on GBP yet"}
            return {"status": "error", "message": error_msg}

    async def sync_insights(self, db: Session, store_id: str, location_id: str):
        """Fetch latest insights (metrics)"""
        try:
            # Fetch for last 30 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            # Format dates for API
            start_date_dict = {"year": start_date.year, "month": start_date.month, "day": start_date.day}
            end_date_dict = {"year": end_date.year, "month": end_date.month, "day": end_date.day}

            metrics_data = self.gbp.fetch_performance_metrics(location_id, start_date_dict, end_date_dict)
            
            synced_count = 0
            
            # API returns list of { metric: "KEY", dailyMetricTimeSeries: [ { date:..., value:... } ] }
            # We need to pivot this to Store One Record Per Day Per Store in `models.Insight`
            
            # 1. Organize data by Date
            daily_data = {} # "YYYY-MM-DD": { queries_direct: 0, ... }
            
            for metric_series in metrics_data.get("multiDailyMetricTimeSeries", []):
                metric_key = metric_series.get("dailyMetric") # e.g. BUSINESS_IMPRESSIONS_DESKTOP_MAPS
                
                for day_val in metric_series.get("dailyMetricTimeSeries", []):
                    d = day_val.get("date")
                    date_str = f"{d['year']}-{d['month']}-{d['day']}"
                    val = int(day_val.get("value", 0))
                    
                    if date_str not in daily_data:
                        daily_data[date_str] = {}
                        
                    # Map API Metric to Model Field
                    if metric_key == "BUSINESS_IMPRESSIONS_DESKTOP_MAPS":
                        daily_data[date_str]["views_maps"] = daily_data[date_str].get("views_maps", 0) + val
                    elif metric_key == "BUSINESS_IMPRESSIONS_MOBILE_MAPS":
                         daily_data[date_str]["views_maps"] = daily_data[date_str].get("views_maps", 0) + val
                    elif metric_key == "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH":
                         daily_data[date_str]["views_search"] = daily_data[date_str].get("views_search", 0) + val
                    elif metric_key == "BUSINESS_IMPRESSIONS_MOBILE_SEARCH":
                         daily_data[date_str]["views_search"] = daily_data[date_str].get("views_search", 0) + val
                    elif metric_key == "WEBSITE_CLICKS":
                         daily_data[date_str]["actions_website"] = val
                    elif metric_key == "CALL_CLICKS":
                         daily_data[date_str]["actions_phone"] = val
                    elif metric_key == "DRIVING_DIRECTIONS_CLICKS":
                         daily_data[date_str]["actions_driving_directions"] = val
            
            # 2. Upsert to DB
            from datetime import date as dt_date
            for date_str, values in daily_data.items():
                y, m, d = map(int, date_str.split("-"))
                target_date = datetime(y, m, d)
                
                insight = db.query(models.Insight).filter(
                    models.Insight.store_id == store_id, 
                    models.Insight.date == target_date
                ).first()
                
                if not insight:
                    insight = models.Insight(store_id=store_id, date=target_date)
                    db.add(insight)
                    synced_count += 1
                
                # Update fields
                if "views_maps" in values: insight.views_maps = values["views_maps"]
                if "views_search" in values: insight.views_search = values["views_search"]
                if "actions_website" in values: insight.actions_website = values["actions_website"]
                if "actions_phone" in values: insight.actions_phone = values["actions_phone"]
                if "actions_driving_directions" in values: insight.actions_driving_directions = values["actions_driving_directions"]
                
            db.commit()
            return {"status": "success", "message": f"Metrics updated for {len(daily_data)} days", "count": synced_count}
        except Exception as e:
            print(f"Sync Insights Error: {e}")
            return {"status": "error", "message": str(e)}

    async def sync_media(self, db: Session, store_id: str, location_id: str):
        """Fetch photos/videos"""
        try:
            media_items = self.gbp.list_media(location_id)
            synced_count = 0
            
            # Handle empty
            if not media_items or not media_items.get("mediaItems"):
                 return {"status": "success", "count": 0, "message": "No media found"}
            
            for item in media_items.get("mediaItems", []):
                media_id = item.get("name") # resource name
                
                existing = db.query(models.MediaItem).filter(models.MediaItem.google_media_id == media_id).first()
                
                if not existing:
                    new_item = models.MediaItem(
                        store_id=store_id,
                        google_media_id=media_id,
                        media_format=item.get("mediaFormat", "PHOTO"),
                        location_association=item.get("locationAssociation", {}).get("category"),
                        google_url=item.get("googleUrl"),
                        thumbnail_url=item.get("thumbnailUrl"),
                        description=item.get("description"),
                        views=item.get("insights", {}).get("viewCount", 0),
                        create_time=datetime.utcnow() # API might not provide create time easily
                    )
                    db.add(new_item)
                    synced_count += 1
                else:
                    existing.views = item.get("insights", {}).get("viewCount", 0)

            db.commit()
            return {"status": "success", "count": synced_count}
        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg and "Forbidden" in error_msg:
                 return {"status": "error", "message": "Google My Business API (Classic) not enabled."}
            if "404" in error_msg or "Not Found" in error_msg:
                 return {"status": "success", "count": 0, "message": "No media found on GBP"}
            return {"status": "error", "message": error_msg}

    async def sync_qa(self, db: Session, store_id: str, location_id: str):
        """Fetch Questions and Answers"""
        try:
            questions = self.gbp.list_questions(location_id)
            q_count = 0
            
            # Handle empty
            if not questions or not questions.get("questions"):
                 return {"status": "success", "count": 0, "message": "No questions found"}
            
            for q_data in questions.get("questions", []):
                q_id = q_data.get("name")
                existing_q = db.query(models.Question).filter(models.Question.google_question_id == q_id).first()
                
                if not existing_q:
                    existing_q = models.Question(
                        store_id=store_id,
                        google_question_id=q_id,
                        text=q_data.get("text"),
                        authore_name=q_data.get("author", {}).get("displayName", "Anonymous"),
                        upvote_count=q_data.get("upvoteCount", 0),
                        create_time=datetime.utcnow() # Approx
                    )
                    db.add(existing_q)
                    q_count += 1
                    db.flush() # get ID
                
                # Fetch Answers logic skipped for brevity/rate limits as before
                pass 
                
            db.commit()
            return {"status": "success", "message": f"Synced {q_count} questions"}
        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg and "Forbidden" in error_msg:
                 return {"status": "error", "message": "Google My Business API (Classic) not enabled."}
            if "404" in error_msg or "Not Found" in error_msg:
                 return {"status": "success", "count": 0, "message": "No questions found on GBP"}
            return {"status": "error", "message": error_msg}

    async def sync_location_details(self, db: Session, store_id: str, location_id: str):
        """Sync basic location info (Hours, Attributes)"""
        try:
             # Just update the store record with latest JSON
             details = self.gbp.get_location_details(location_id)
             store = db.query(models.Store).filter(models.Store.id == store_id).first()
             if store:
                 store.gbp_data = details
                 # Also update top-level fields for easier querying if needed
                 if details.get("title"): store.name = details.get("title")
                 # db.add(store) # Not needed if queried
                 db.commit()
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
