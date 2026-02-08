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
                location_suffix = location_id.split("/")[-1]
                
                # Iterate through accounts to find the correct one
                for account in accounts_data["accounts"]:
                    account_name = account["name"]
                    candidate_name = f"{account_name}/locations/{location_suffix}"
                    
                    # Verify if this account has access to the location using a lightweight v4 call
                    # We use list_reviews as a check, as it requires v4 access
                    try:
                        # Just check if we can access the endpoint (even if empty)
                        self.gbp.list_reviews(candidate_name)
                        v4_location_name = candidate_name
                        break
                    except Exception as e:
                        # If 404 or 403, this is likely not the right account (or API not enabled)
                        # We continue to the next account
                        continue
                
                if not v4_location_name:
                    resolve_error = "Location not found in any of the connected Google Accounts."
            else:
                 resolve_error = "No Google Accounts found for this user."
        except Exception as e:
            resolve_error = f"Failed to list accounts: {e}"
            
        # If we couldn't resolve v4 name, we cannot proceed with v4 APIs (Reviews, Posts, Media, QA)
        if not v4_location_name:
             # We can still sync Insights/Location which use v1 (location_id)
             print(f"Warning: {resolve_error}. Skipping v4 dependent syncs.")
             # For Insights (v1), we don't strictly need v4 name, but let's return error for now to ensure consistency
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
            if hasattr(e, 'response') and e.response is not None:
                try:
                     error_msg += f" | Details: {e.response.text}"
                except:
                     pass
            print(f"Sync Reviews Error: {error_msg}")
            
            if "403" in error_msg and "Forbidden" in error_msg:
                 return {"status": "error", "message": "Google My Business API (Classic) not enabled. Please enable it in Cloud Console."}
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
            if hasattr(e, 'response') and e.response is not None:
                try:
                     error_msg += f" | Details: {e.response.text}"
                except:
                     pass
            print(f"Sync Posts Error: {error_msg}")
            if "403" in error_msg and "Forbidden" in error_msg:
                 return {"status": "error", "message": "Google My Business API (Classic) not enabled."}
            if "404" in error_msg or "Not Found" in error_msg:
                return {"status": "success", "count": 0, "message": "No posts on GBP yet"}
            return {"status": "error", "message": error_msg}

    async def sync_insights(self, db: Session, store_id: str, location_id: str):
        """Fetch latest insights (metrics)"""
        try:
            # Fetch for last 730 days (approx 2 years) to capture all available history (API limit usually ~18 months)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=730)
            
            # Format dates for API
            start_date_dict = {"year": start_date.year, "month": start_date.month, "day": start_date.day}
            end_date_dict = {"year": end_date.year, "month": end_date.month, "day": end_date.day}

            metrics_data = self.gbp.fetch_performance_metrics(location_id, start_date_dict, end_date_dict)
            
            synced_count = 0
            
            # Handle empty response
            if not metrics_data:
                return {"status": "success", "count": 0, "message": "No metrics data returned from API"}
            
            # API returns list of { metric: "KEY", dailyMetricTimeSeries: [ { date:..., value:... } ] }
            # We need to pivot this to Store One Record Per Day Per Store in `models.Insight`
            
            # 1. Organize data by Date
            daily_data = {} # "YYYY-MM-DD": { queries_direct: 0, ... }
            
            # Actual API structure:
            # multiDailyMetricTimeSeries[0].dailyMetricTimeSeries[].dailyMetric
            # multiDailyMetricTimeSeries[0].dailyMetricTimeSeries[].timeSeries.datedValues[].date/value
            
            for series_group in metrics_data.get("multiDailyMetricTimeSeries", []):
                for metric_series in series_group.get("dailyMetricTimeSeries", []):
                    metric_key = metric_series.get("dailyMetric") # e.g. BUSINESS_IMPRESSIONS_DESKTOP_MAPS
                    
                    time_series = metric_series.get("timeSeries", {})
                    dated_values = time_series.get("datedValues", [])
                    
                    for day_val in dated_values:
                        d = day_val.get("date")
                        if not d or not d.get("year"):
                            continue  # Skip if date is None or incomplete
                        date_str = f"{d['year']}-{d['month']:02d}-{d['day']:02d}"
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
                             daily_data[date_str]["actions_website"] = daily_data[date_str].get("actions_website", 0) + val
                        elif metric_key == "CALL_CLICKS":
                             daily_data[date_str]["actions_phone"] = daily_data[date_str].get("actions_phone", 0) + val
                        elif metric_key == "BUSINESS_DIRECTION_REQUESTS":
                             daily_data[date_str]["actions_driving_directions"] = daily_data[date_str].get("actions_driving_directions", 0) + val
            
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
            
            # Include debug info about API response structure
            first_series = metrics_data.get("multiDailyMetricTimeSeries", [{}])[0] if metrics_data else {}
            debug_info = {
                "api_response_keys": list(metrics_data.keys()) if metrics_data else [],
                "multiDailyMetricTimeSeries_count": len(metrics_data.get("multiDailyMetricTimeSeries", [])) if metrics_data else 0,
                "first_series_keys": list(first_series.keys()) if first_series else [],
                "first_series_sample": str(first_series)[:500] if first_series else "empty",
            }
            
            return {"status": "success", "message": f"Metrics updated for {len(daily_data)} days", "count": synced_count, "debug": debug_info}
        except Exception as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                     error_msg += f" | Details: {e.response.text}"
                except:
                     pass
            print(f"Sync Insights Error: {error_msg}")
            return {"status": "error", "message": error_msg}

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
            if hasattr(e, 'response') and e.response is not None:
                try:
                     error_msg += f" | Details: {e.response.text}"
                except:
                     pass
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
            if hasattr(e, 'response') and e.response is not None:
                try:
                     error_msg += f" | Details: {e.response.text}"
                except:
                     pass
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
             
             # Fallback: If address or attributes are missing (likely due to mask issues in get_location_details),
             # try to fetch them via list_locations which might have a working mask for this specific account.
             # We need account_name for list_locations.
             # We can try to extract it from store.google_location_id if it was stored in v4 format, 
             # OR we can assume the caller might know it. 
             # Ideally we should pass v4_location_name to this method. 
             # But for now, let's try to find the account if we really need to.
             
             needs_fallback = False
             if not details.get("postalAddress") or not details.get("attributes") or not details.get("regularHours"):
                 needs_fallback = True
                 
             if needs_fallback:
                 try:
                     # 1. Iterate accounts to find the location using robust search
                     account_name = None
                     accounts = self.gbp.list_accounts()
                     for acc in accounts.get("accounts", []):
                         # Use robust find which filters server-side
                         loc = self.gbp.find_location_robust(acc["name"], location_id)
                         if loc:
                             print(f"DEBUG: Found location via robust fallback: {loc['name']}")
                             # Merge Data
                             if not details.get("postalAddress") and loc.get("postalAddress"):
                                 details["postalAddress"] = loc["postalAddress"]
                                 print("DEBUG: Recovered postalAddress")
                             
                             if not details.get("attributes") and loc.get("attributes"):
                                 details["attributes"] = loc["attributes"]
                                 print("DEBUG: Recovered attributes")
                                 
                             if not details.get("regularHours") and loc.get("regularHours"):
                                 details["regularHours"] = loc["regularHours"]
                                 print("DEBUG: Recovered regularHours")
                                 
                             if not details.get("serviceArea") and loc.get("serviceArea"):
                                 details["serviceArea"] = loc["serviceArea"]
                             
                             break # Found and merged
                             
                 except Exception as fb_err:
                     print(f"DEBUG: Fallback fetch failed: {fb_err}")

             store = db.query(models.Store).filter(models.Store.id == store_id).first()
             if store:
                 store.gbp_data = details
                 store.last_synced_at = datetime.utcnow()
                 
                 # Map top-level fields for system consistency (AI context, etc.)
                 if details.get("title"): 
                     store.name = details.get("title")
                 
                 # Description
                 if details.get("profile") and details["profile"].get("description"):
                     store.description = details["profile"]["description"]
                 
                 # Category
                 if details.get("categories") and details["categories"].get("primaryCategory"):
                     store.category = details["categories"]["primaryCategory"].get("displayName")

                 # --- Detailed Sync Implementation (Copied from locations.py) ---
        
                 # Phone Number
                 if details.get("phoneNumbers") and details["phoneNumbers"].get("primaryPhone"):
                    store.phone_number = details["phoneNumbers"]["primaryPhone"]
            
                 # Website
                 if details.get("websiteUri"):
                    store.website_url = details["websiteUri"]
            
                 # Address Components
                 # Try to use formatted address first as it's most reliable for display
                 if details.get("postalAddress"):
                    addr = details["postalAddress"]
                    store.zip_code = addr.get("postalCode")
                    store.prefecture = addr.get("administrativeArea")
            
                    # Logic for Japanese Addresses usually:
                    # Prefecture + Locality + AddressLines
                    
                    city_val = addr.get("locality", "")
                    sub_locality = addr.get("subLocality", "") # Some JP addresses use this
                    
                    if sub_locality:
                         city_val = f"{city_val}{sub_locality}"

                    address_lines = addr.get("addressLines", [])
            
                    if address_lines:
                        # If city is missing (sometimes happens in API), try to infer from first line/admin area
                        if not city_val and not store.prefecture:
                             # Fallback logic
                             pass

                        if not city_val:
                             # Use first part of lines if no city
                             pass

                        # Robust construction
                        if city_val:
                            # Avoid duplication if city is already in address line 0 (Common in Google API)
                            if address_lines[0].startswith(city_val):
                                 store.address_line2 = "".join(address_lines) # Just use all lines
                            else:
                                 store.address_line2 = "".join(address_lines)
                        else:
                             store.address_line2 = "".join(address_lines)
                    else:
                        store.address_line2 = None
                
                    store.city = city_val
            
                    # Update full address string as fallback/display
                    # Use Google's formatted address if available, else construct
                    # Note: API doesn't always return formattedAddress in Details call, mainly list
                    # But if we have components, let's build it standard JP way
                    
                    full_addr = f"〒{store.zip_code or ''} {store.prefecture or ''}{store.city or ''}{store.address_line2 or ''}"
                    store.address = full_addr
                 else:
                     # If address is definitely missing (e.g. Service Area Business), clear it?
                     # Or keep existing?
                     # If we have basic info but no address, it might be an SAB.
                     # Let's check serviceArea
                     if details.get("serviceArea"):
                         store.address = "出張型サービス/非店舗型" # "Service Area Business"
                     # Only clear if we clearly got a response saying "no address"
                     # For now, let's not aggressively clear unless sure.

                 # Regular Hours
                 if details.get("regularHours"):
                    # Store as JSON 
                    store.regular_hours = details["regularHours"]
            
                 # Attributes
                 if details.get("attributes"):
                     store.attributes = details["attributes"]
                     
                 # Lat/Lng
                 # if details.get("latlng"):
                 #    store.latitude = details["latlng"].get("latitude")
                 #    store.longitude = details["latlng"].get("longitude")

                 db.commit()
             return {"status": "success", "message": "Location details updated"}
        except Exception as e:
             import traceback
             traceback.print_exc()
             return {"status": "error", "message": f"Sync Location Error: {str(e)}"}

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
