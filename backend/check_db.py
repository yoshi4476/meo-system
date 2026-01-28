from sqlalchemy.orm import Session
from database import SessionLocal
import models

def check_data():
    db = SessionLocal()
    try:
        store = db.query(models.Store).first()
        if not store:
            print("No store found!")
            return

        print(f"Store: {store.name} (ID: {store.id})")
        print(f"Last Synced: {store.last_synced_at}")
        
        posts_count = db.query(models.Post).count()
        print(f"Posts: {posts_count}")
        
        reviews_count = db.query(models.Review).count()
        print(f"Reviews: {reviews_count}")
        
        media_count = db.query(models.MediaItem).count()
        print(f"Media: {media_count}")
        
        qa_count = db.query(models.Question).count()
        print(f"Q&A: {qa_count}")
        
        insight_count = db.query(models.Insight).count()
        print(f"Insights: {insight_count}")

    finally:
        db.close()

if __name__ == "__main__":
    check_data()
