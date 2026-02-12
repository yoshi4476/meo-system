from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime, timedelta
from services import google_api
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def check_and_publish_scheduled_posts():
    """
    Check for posts that are scheduled and due for publishing.
    Delegates to SNSService for multi-platform support.
    """
    logger.info("Scheduler: Checking for scheduled posts...")
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        due_posts = db.query(models.Post).filter(
            models.Post.status == 'SCHEDULED',
            models.Post.scheduled_at <= now
        ).all()

        logger.info(f"Scheduler: Found {len(due_posts)} posts to publish.")

        for post in due_posts:
            try:
                store = db.query(models.Store).filter(models.Store.id == post.store_id).first()
                if not store:
                    logger.warning(f"Store not found for post {post.id}")
                    post.status = "FAILED"
                    post.social_post_ids = {"error": "Store not found"}
                    continue

                # Find valid user connection
                # We iterate through ALL users associated with the store (direct or via company)
                # to find ONE that has a valid (or refreshable) Google connection.
                
                target_user = None
                valid_connection = None
                
                potential_users = list(store.users)
                if store.company and store.company.users:
                     # Add company users, avoiding duplicates
                     existing_ids = [u.id for u in potential_users]
                     potential_users.extend([u for u in store.company.users if u.id not in existing_ids])

                for user in potential_users:
                    if user.google_connection:
                        conn = user.google_connection
                        # Check expiry and refresh if needed
                        if conn.expiry and conn.expiry < datetime.utcnow():
                            if conn.refresh_token:
                                try:
                                    logger.info(f"Refreshing token for user {user.email}...")
                                    new_tokens = google_api.refresh_access_token(conn.refresh_token)
                                    conn.access_token = new_tokens.get("access_token")
                                    expires_in = new_tokens.get("expires_in", 3600)
                                    conn.expiry = datetime.utcnow() + timedelta(seconds=expires_in)
                                    db.commit() # Commit the refresh immediately
                                    logger.info("Token refreshed successfully.")
                                    target_user = user
                                    valid_connection = conn
                                    break # Found a working user!
                                except Exception as e:
                                    logger.warning(f"Failed to refresh token for user {user.email}: {e}")
                                    # Continue to next user
                            else:
                                # Expired and no refresh token
                                continue
                        else:
                            # Valid token
                            target_user = user
                            valid_connection = conn
                            break
                
                if not target_user:
                     logger.error(f"No valid user/token found to execute post {post.id} for store {store.name}")
                     post.status = "FAILED"
                     post.social_post_ids = {"error": "No valid Google account linked. Please re-connect in Settings."}
                     continue

                from services.sns_service import SNSService
                # Re-fetch user to ensure attached to session (though likely still is)
                service = SNSService(db, target_user)
                
                logger.info(f"Publishing post {post.id} via SNSService (User: {target_user.email})...")
                await service.publish_post(post.id)
                logger.info(f"Post {post.id} processed.")

            except Exception as e:
                logger.error(f"Failed to publish post {post.id}: {e}")
                post.status = "FAILED"
                post.social_post_ids = {"error": str(e)}
        
        db.commit()
    except Exception as e:
        logger.error(f"Scheduler Error: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_and_publish_scheduled_posts, 'interval', minutes=1)
        scheduler.add_job(auto_reply_to_reviews, 'interval', minutes=5)  # Check every 5 minutes
        scheduler.add_job(sync_all_locations, 'interval', minutes=60) # Sync every hour
        
        # Enterprise Jobs
        scheduler.add_job(check_daily_rankings, 'interval', hours=24) # Daily Rank Check
        
        scheduler.start()
        logger.info("Scheduler started with post publishing, auto-reply, hourly sync, and daily rank check.")
        # Test job to confirm execution
        scheduler.add_job(lambda: logger.info("Scheduler Heartbeat: Tick-tock"), 'interval', minutes=1)

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down.")

async def auto_reply_to_reviews():
    """
    Auto-reply to unreplied reviews for stores that have auto_reply_enabled.
    Uses AI to generate replies.
    """
    logger.info("Scheduler: Checking for reviews to auto-reply...")
    db: Session = SessionLocal()
    try:
        from services import ai_generator
        
        # Find stores with auto-reply enabled
        auto_reply_stores = db.query(models.Store).filter(
            models.Store.auto_reply_enabled == True
        ).all()
        
        logger.info(f"Found {len(auto_reply_stores)} stores with auto-reply enabled.")
        
        for store in auto_reply_stores:
            # Find unreplied reviews for this store
            query = db.query(models.Review).filter(
                models.Review.store_id == store.id,
                models.Review.reply_comment == None
            )

            # Filter by start date if set
            if store.auto_reply_start_date:
                query = query.filter(models.Review.create_time >= store.auto_reply_start_date)
            
            unreplied_reviews = query.limit(5).all()  # Process max 5 per store per cycle
            
            if not unreplied_reviews:
                continue
                
            logger.info(f"Store {store.name}: Found {len(unreplied_reviews)} unreplied reviews.")
            
            # Find a user with Google connection for this store
            valid_connection = None
            api_key = None
            
            # Combine store users and company users (if company exists)
            potential_users = list(store.users)
            if store.company and store.company.users:
                # Add company users who might not be currently selecting this store
                company_users = [u for u in store.company.users if u.id not in [su.id for su in store.users]]
                potential_users.extend(company_users)
                
            for user in potential_users:
                if user.google_connection and user.google_connection.access_token:
                    # Check if user has OpenAI key saved (in settings)
                    user_settings = db.query(models.UserSettings).filter(
                        models.UserSettings.user_id == user.id
                    ).first()
                    
                    if user_settings and user_settings.openai_api_key:
                        valid_connection = user.google_connection
                        api_key = user_settings.openai_api_key
                        logger.info(f"Found valid connection and API key from user {user.email}")
                        break
            
            # If still no connection, check if any user has connection, and any user has API key? 
            # (Currently we require same user to have both for simplicity/security, 
            # but we could mix if they belong to same company)
            
            if not valid_connection:
                logger.warning(f"No valid Google connection for store {store.name}")
                continue
                
            if not api_key:
                logger.warning(f"No OpenAI API key found for store {store.name}")
                continue
            
            # Refresh token if needed
            from services import google_api
            if valid_connection.expiry and valid_connection.expiry < datetime.utcnow():
                if valid_connection.refresh_token:
                    new_tokens = google_api.refresh_access_token(valid_connection.refresh_token)
                    valid_connection.access_token = new_tokens.get("access_token")
                    valid_connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
                    db.commit()
            
            client = google_api.GBPClient(valid_connection.access_token)
            ai_client = ai_generator.AIClient(api_key=api_key)
            
            for review in unreplied_reviews:
                try:
                    # Generate AI reply
                    reply_text = ai_client.generate_review_reply(
                        review_text=review.comment or "",
                        reviewer_name=review.reviewer_name,
                        star_rating=review.star_rating,
                        tone="friendly",
                        custom_instruction=store.auto_reply_prompt
                    )
                    
                    # Post reply to Google
                    review_name = f"{store.google_location_id}/reviews/{review.google_review_id}"
                    client.reply_to_review(review_name, reply_text)
                    
                    # Update local record
                    review.reply_comment = reply_text
                    review.reply_time = datetime.utcnow()
                    
                    logger.info(f"Auto-replied to review {review.id} for store {store.name}")
                    
                except Exception as e:
                    logger.error(f"Failed to auto-reply to review {review.id}: {e}")
                    continue
            
            
            db.commit()
            
    except Exception as e:
        logger.error(f"Auto-reply scheduler error: {e}")
    finally:
        db.close()

async def sync_all_locations():
    """
    Periodically sync location details from Google for all connected stores.
    """
    logger.info("Scheduler: Syncing all location details...")
    db: Session = SessionLocal()
    try:
        from services.sync_service import get_sync_service
        from services import google_api
        
        stores = db.query(models.Store).filter(models.Store.google_location_id != None).all()
        
        for store in stores:
            try:
                # Find a valid connection
                valid_connection = None
                
                potential_users = list(store.users)
                if store.company and store.company.users:
                     potential_users.extend([u for u in store.company.users if u.id not in [su.id for su in store.users]])

                for user in potential_users:
                    if user.google_connection and user.google_connection.access_token:
                        valid_connection = user.google_connection
                        break
                
                if not valid_connection:
                    continue

                # Refresh if needed
                if valid_connection.expiry and valid_connection.expiry < datetime.utcnow():
                    if valid_connection.refresh_token:
                        new_tokens = google_api.refresh_access_token(valid_connection.refresh_token)
                        valid_connection.access_token = new_tokens.get("access_token")
                        expires_in = new_tokens.get("expires_in", 3600)
                        valid_connection.expiry = datetime.utcnow() + timedelta(seconds=expires_in)
                        db.commit()

                # Sync
                client = google_api.GBPClient(valid_connection.access_token)
                from services.sync_service import GoogleSyncService
                service = GoogleSyncService(client)
                await service.sync_location_details(db, store.id, store.google_location_id)
                logger.info(f"Synced location details for {store.name}")
                
            except Exception as e:
                logger.error(f"Error syncing store {store.id}: {e}")
                continue
                
    except Exception as e:
        logger.error(f"Sync scheduler error: {e}")
    finally:
        db.close()

async def check_daily_rankings():
    """
    Mock function to simulate checking keyword rankings daily.
    """
    logger.info("Scheduler: Checking daily rankings (MOCK)...")
    # In reality, this would query all Keywords, call a SERP API, and save RankLog.
    # For now, we just log.
    pass


