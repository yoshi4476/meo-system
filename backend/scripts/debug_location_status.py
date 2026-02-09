import sys
import os
import json
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import database
import models
import services.google_api as google_api

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError ("Type not serializable")

def debug_location_status():
    db = database.SessionLocal()
    try:
        # Get the first user with a connection (assuming it's the one we're debugging)
        user = db.query(models.User).filter(models.User.email == "7senses.gran.toukou@gmail.com").first()
        if not user:
            print("User not found")
            return

        connection = user.google_connection
        if not connection:
            print("No Google Connection found")
            return

        client = google_api.GBPClient(connection.access_token)
        
        # Get the store
        store = db.query(models.Store).first() # Just get the first store for now
        if not store:
            print("No store found in DB")
            return

        print(f"--- Debugging Store: {store.name} ({store.id}) ---")
        print(f"Google Location ID: {store.google_location_id}")

        # 1. Check Local DB Data
        print("\n[LOCAL DB DATA]")
        print(f"Address (DB): {store.address}")
        # print(f"Hours (DB): {store.id}") # hours might not be in a simple column yet if migration failed, checking gbp_data
        if store.gbp_data:
            print(f"Address (gbp_data): {json.dumps(store.gbp_data.get('postalAddress'), indent=2, ensure_ascii=False)}")
            print(f"Hours (gbp_data): {json.dumps(store.gbp_data.get('regularHours'), indent=2, ensure_ascii=False)}")
        else:
            print("gbp_data is EMPTY")

        # 2. Check Google API Raw Data
        print("\n[GOOGLE API RAW DATA]")
        try:
            if store.google_location_id:
                details = client.get_location_details(store.google_location_id)
                print(f"Address (API): {json.dumps(details.get('postalAddress'), indent=2, ensure_ascii=False)}")
                print(f"Hours (API): {json.dumps(details.get('regularHours'), indent=2, ensure_ascii=False)}")
                
                # Check for attributes too just in case
                # print(f"Attributes (API): {json.dumps(details.get('attributes'), indent=2)}")
            else:
                print("No Google Location ID to fetch from API")
                
                # Try listing locations to see what's available
                print("Listing available locations...")
                locs = client.list_locations(google_api.get_account_id(client))
                for l in locs:
                    print(f"Found: {l.get('name')} - {l.get('title')}")

        except Exception as e:
            print(f"API Error: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    debug_location_status()
