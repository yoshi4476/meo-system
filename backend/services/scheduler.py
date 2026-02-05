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
        scheduler.start()
        logger.info("Scheduler started.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down.")
