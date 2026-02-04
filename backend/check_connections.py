from sqlalchemy.orm import Session
from database import SessionLocal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import os

# Point to Root DB
ROOT_DB = "sqlite:///../sql_app.db"
engine = create_engine(ROOT_DB)
SessionRoot = sessionmaker(bind=engine)

def check_connections():
    db: Session = SessionRoot()
    try:
        print("--- Users & Connections ---")
        users = db.query(models.User).all()
        for u in users:
            conn = u.google_connection
            has_token = "YES" if conn and conn.access_token else "NO"
            print(f"User: {u.email}, Role: {u.role}, StoreID: {u.store_id}, GoogleConn: {has_token}")
            
        print("\n--- Stores ---")
        stores = db.query(models.Store).all()
        for s in stores:
            print(f"Store: {s.name} (ID: {s.id})")
            print(f"  Google Loc ID: {s.google_location_id}")
            print(f"  Synced At: {s.last_synced_at}")

    finally:
        db.close()

if __name__ == "__main__":
    check_connections()
