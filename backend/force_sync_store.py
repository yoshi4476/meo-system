
import sys
import os
import sys
import os
from datetime import datetime

# Setup path to backend
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BACKEND_DIR)

from database import SessionLocal
import models
from services import google_api

def force_sync():
    db = SessionLocal()
    try:
        # Find the store we just linked
        # We know the email "7senses.gran.toukou@gmail.com"
        user = db.query(models.User).filter(models.User.email == "7senses.gran.toukou@gmail.com").first()
        if not user:
            print("User not found")
            return

        if not user.store_id:
            print("User has no store linked")
            return

        store = db.query(models.Store).filter(models.Store.id == user.store_id).first()
        print(f"Syncing Store: {store.name} ({store.id})")
        print(f"Google Location ID: {store.google_location_id}")

        if not store.google_location_id:
            print("No Google Location ID linked!")
            return

        if not user.google_connection:
            print("No Google Connection!")
            return

        client = google_api.GBPClient(user.google_connection.access_token)
        
        print("--- Attempting Fetch ---")
        try:
            details = client.get_location_details(store.google_location_id)
            print("Fetch Success!")
            print(f"Name: {details.get('title')}")
            print(f"Phone: {details.get('phoneNumbers')}")
            print(f"Hours keys: {details.get('regularHours', {}).keys()}")
            print(f"Attributes keys: {details.get('attributes')}")
            
            # Save raw to DB just in case
            store.gbp_data = details
            store.last_synced_at = datetime.utcnow()
            db.commit()
            print("Saved to DB.")
            
        except Exception as e:
            print(f"Fetch Failed: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    force_sync()
