
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import os

# Force backend DB (v2)
db_path = os.path.join(os.path.dirname(__file__), "sql_app_v2.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_store():
    db = SessionLocal()
    try:
        store = db.query(models.Store).first()
        if not store:
            print("No store found!")
        else:
            print(f"Store: {store.name}")
            print(f"Phone: {store.phone_number}")
            print(f"Address: {store.address}")
            print(f"Zip: {store.zip_code}")
            print(f"Hours: {store.regular_hours}")
            print(f"Attributes: {store.attributes}")
            print(f"Sync Time: {store.last_synced_at}")

        print("-" * 20)
        print("Checking Recent Posts:")
        posts = db.query(models.Post).order_by(models.Post.created_at.desc()).limit(5).all()
        for p in posts:
            print(f"ID: {p.id}")
            print(f"Scheduled: '{p.scheduled_at}'")
            print(f"Created: '{p.created_at}'")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_store()
