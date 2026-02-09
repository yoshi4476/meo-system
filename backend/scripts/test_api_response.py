
import sys
import os
import json

# Add parent directory to path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import SessionLocal
import models
import datetime

# Helper to serialize datetime
def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError ("Type %s not serializable" % type(obj))

def test_api_response():
    db = SessionLocal()
    try:
        # 1. Get the user
        user = db.query(models.User).first()
        if not user:
            print("CRITICAL: No user found.")
            return

        print(f"User: {user.email}")
        print(f"Linked Store ID: {user.store_id}")

        if not user.store_id:
            print("User has NO store linked. API will return [] or 404.")
            return

        # 2. Get the store
        store = db.query(models.Store).filter(models.Store.id == user.store_id).first()
        if not store:
            print(f"CRITICAL: Store {user.store_id} not found in DB.")
            return

        print(f"Store Name in DB: {store.name}")
        
        # 3. Inspect gbp_data (The JSON blob frontend uses)
        gbp_data = store.gbp_data
        
        print("\n--- API RESPONSE SIMULATION (store.gbp_data) ---")
        if not gbp_data:
            print("CRITICAL: store.gbp_data is EMPTY/NULL.")
        else:
            print(json.dumps(gbp_data, indent=2, ensure_ascii=False))

            # Validate key fields
            print("\n--- VALIDATION ---")
            print(f"Title: {gbp_data.get('title', 'MISSING')}")
            print(f"Address: {gbp_data.get('postalAddress', 'MISSING')}")
            print(f"Website: {gbp_data.get('websiteUri', 'MISSING')}")
            print(f"Hours: {gbp_data.get('regularHours', 'MISSING')}")
            print(f"Attributes: {len(gbp_data.get('attributes', []))} items")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_api_response()
