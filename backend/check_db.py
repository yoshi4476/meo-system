from sqlalchemy.orm import Session
from database import SessionLocal
import models

def check_data():
    db = SessionLocal()
    print("Checking DB...")
    try:
        posts = db.query(models.Post).order_by(models.Post.created_at.desc()).limit(5).all()
        print(f"Found {len(posts)} posts")
        for p in posts:
            print(f"Post ID: {p.id}")
            print(f"  Content: {p.content[:30]}...")
            print(f"  Status: {p.status}")
            print(f"  Created At: {p.created_at} (Type: {type(p.created_at)})")
            print(f"  Scheduled At: {p.scheduled_at} (Type: {type(p.scheduled_at)})")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
