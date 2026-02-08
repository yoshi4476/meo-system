import sys
import os
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models
from services.sync_service import GoogleSyncService
from services.google_api import GBPClient

def debug_sync():
    db = SessionLocal()
    try:
        # Get the first user with a connected Google account
        user = db.query(models.User).filter(models.User.google_connection != None).first()
        if not user:
            print("No connected user found. Cannot debug.")
            return

        print(f"Debug User: {user.email}")
        
        # Get the user's store
        store = None
        if user.store_id:
             store = db.query(models.Store).filter(models.Store.id == user.store_id).first()
        
        if not store:
            # Try to find *any* store connected to this user
            # Assuming company admin or similar? Or just pick first store.
            store = db.query(models.Store).first()
            
        if not store:
            print("No store found in DB.")
            return

        print(f"Target Store: {store.name} (ID: {store.id})")
        print(f"Google Location ID: {store.google_location_id}")
        
        # Initialize Service
        sync_service = GoogleSyncService(db)
        
        # 1. Run the Sync Logic (This uses the new robust fallback)
        print("\n--- Running Sync Logic ---")
        result = sync_service.sync_location_details(store.id)
        print(f"Sync Result: {result}")
        
        # 2. Inspect the DB after sync
        db.refresh(store)
        print("\n--- DB Data After Sync ---")
        print(f"Store Name: {store.name}")
        print(f"Address: {store.address}")
        print(f"Zip: {store.zip_code}")
        print(f"Prefecture: {store.prefecture}")
        print(f"Regular Hours: {json.dumps(store.regular_hours, ensure_ascii=False)[:200]}...") # Truncate
        print(f"Attributes: {json.dumps(store.attributes, ensure_ascii=False)[:200]}...") # Truncate
        
        # 3. Direct API Check (Robust Method)
        print("\n--- Direct API Check (Robust Method) ---")
        client = GBPClient(user.google_connection.access_token)
        accounts = client.list_accounts()
        if accounts.get("accounts"):
            acc_name = accounts["accounts"][0]["name"]
            print(f"Account: {acc_name}")
            
            # Call find_location_robust
            loc = client.find_location_robust(acc_name, store.google_location_id)
            if loc:
                print("Robust Find SUCCESS.")
                print(f"Postal Address in Raw: {loc.get('postalAddress')}")
                print(f"Attributes in Raw: {'attributes' in loc}")
            else:
                print("Robust Find FAILED (Returned None).")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_sync()
