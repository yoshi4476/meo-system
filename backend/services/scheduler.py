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
    """
    logger.info("Scheduler: Checking for scheduled posts...")
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find posts that are SCHEDULED and scheduled_at <= now
        due_posts = db.query(models.Post).filter(
            models.Post.status == 'SCHEDULED',
            models.Post.scheduled_at <= now
        ).all()

        logger.info(f"Scheduler: Found {len(due_posts)} posts to publish.")

        for post in due_posts:
            try:
                store = db.query(models.Store).filter(models.Store.id == post.store_id).first()
                if not store or not store.google_location_id:
                    logger.warning(f"Store not linked or found for post {post.id}")
                    post.status = "FAILED"
                    continue

                # We need a user to get the connection. 
                # Since multiple users can be in a store, any user with a valid connection could work.
                # However, the connection is tied to a user. Best effort: try to find a user in this store with a valid connection.
                
                # Logic: Find a user associated with this store (or company) who has a valid google_connection
                valid_connection = None
                
                # Check store users first
                for user in store.users:
                    if user.google_connection and user.google_connection.access_token:
                        valid_connection = user.google_connection
                        break
                
                # If not found, check company admins? (Not implemented for simplicity, assuming direct store user or creator)
                # Ideally, we should store `created_by_user_id` in Post model, but we don't have it.
                # Fallback: Check if there's any user in the company who has access?
                # For now, relying on store.users relationship.
                
                if not valid_connection:
                    logger.error(f"No valid Google connection found for store {store.name}")
                    post.status = "FAILED" # Or keep SCHEDULED to retry?
                    continue

                connection = valid_connection

                # Refresh token if needed
                if connection.expiry and connection.expiry < datetime.utcnow():
                    if connection.refresh_token:
                        logger.info(f"Refreshing token for user {connection.user_id}")
                        new_tokens = google_api.refresh_access_token(connection.refresh_token)
                        connection.access_token = new_tokens.get("access_token")
                        expires_in = new_tokens.get("expires_in", 3600)
                        connection.expiry = datetime.utcnow() + timedelta(seconds=expires_in)
                        db.commit() # Save token update immediately

                client = google_api.GBPClient(connection.access_token)
                
                post_data = {
                    "summary": post.content,
                    "topicType": "STANDARD",
                }
                if post.media_url:
                    post_data["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": post.media_url}]

                logger.info(f"Publishing post {post.id} to {store.name}...")
                client.create_local_post(store.google_location_id, post_data)
                
                post.status = "PUBLISHED"
                logger.info(f"Post {post.id} published successfully.")

            except Exception as e:
                logger.error(f"Failed to publish post {post.id}: {e}")
                post.status = "FAILED"
        
        db.commit()
    except Exception as e:
        logger.error(f"Scheduler Error: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_and_publish_scheduled_posts, 'interval', minutes=1)
        scheduler.add_job(auto_reply_to_reviews, 'interval', minutes=5)  # Check every 5 minutes
        scheduler.start()
        logger.info("Scheduler started with post publishing and auto-reply jobs.")

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
            unreplied_reviews = db.query(models.Review).filter(
                models.Review.store_id == store.id,
                models.Review.reply_comment == None
            ).limit(5).all()  # Process max 5 per store per cycle
            
            if not unreplied_reviews:
                continue
                
            logger.info(f"Store {store.name}: Found {len(unreplied_reviews)} unreplied reviews.")
            
            # Find a user with Google connection for this store
            valid_connection = None
            api_key = None
            
            for user in store.users:
                if user.google_connection and user.google_connection.access_token:
                    valid_connection = user.google_connection
                    # Check if user has OpenAI key saved (in settings)
                    user_settings = db.query(models.UserSettings).filter(
                        models.UserSettings.user_id == user.id
                    ).first()
                    if user_settings and user_settings.openai_api_key:
                        api_key = user_settings.openai_api_key
                    break
            
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
