
import sys
import os
import json
import logging

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import SessionLocal
import models
from services import google_api

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def diagnose():
    db = SessionLocal()
    try:
        # 1. Get a user with Google Connection
        user = db.query(models.User).join(models.GoogleConnection).first()
        if not user or not user.google_connection:
            print("No user with Google Connection found.")
            return

        print(f"User found: {user.email}")
        store_id = user.store_id
        store = db.query(models.Store).filter(models.Store.id == store_id).first()
        
        if not store:
            print("User has no store selected.")
            # Try to pick first store
            store = db.query(models.Store).first()
            if not store:
                print("No stores in DB.")
                return

        print(f"Target Store: {store.name} (ID: {store.id})")
        print(f"Google Location ID: {store.google_location_id}")

        if not store.google_location_id:
            print("Store has no Google Location ID. Cannot fetch.")
            return

        # 2. Initialize Client
        client = google_api.GBPClient(user.google_connection.access_token)

        # 3. Fetch Raw Details
        print("\n--- 3. Fetching Raw Details from Google ---")
        try:
            # Try the exact method used in sync_service
            details = client.get_location_details(store.google_location_id)
            print("Raw Details (Top 5 keys):", list(details.keys())[:5])
            
            # Check specific fields
            print(f"Name: {details.get('name')}")
            print(f"Title: {details.get('title')}")
            print(f"StoreAddress: {json.dumps(details.get('storeAddress'), indent=2, ensure_ascii=False)}")
            print(f"PostalAddress: {json.dumps(details.get('postalAddress'), indent=2, ensure_ascii=False)}")
            print(f"WebsiteUri: {details.get('websiteUri')}")
            print(f"RegularHours: {json.dumps(details.get('regularHours'), indent=2, ensure_ascii=False)}")
            
            # Attributes
            print("\n--- Attributes Raw ---")
            raw_attrs = details.get("attributes", [])
            print(f"Count: {len(raw_attrs)}")
            if raw_attrs:
                print(f"Sample: {raw_attrs[0]}")
            else:
                print("No attributes in main response. Trying list_attributes...")
                attrs_resp = client.list_attributes(store.google_location_id)
                raw_attrs = attrs_resp.get("attributes", [])
                print(f"Count (Separate Fetch): {len(raw_attrs)}")
                if raw_attrs:
                    print(f"Sample: {raw_attrs[0]}")

            # 4. Test Metadata Mapping
            print("\n--- 4. Testing Attribute Metadata ---")
            if raw_attrs:
                meta_resp = client.get_attribute_metadata(language_code="ja", country_code="JP")
                meta_map = { a["attributeId"]: a.get("displayName") for a in meta_resp.get("attributes", []) }
                print(f"Fetched {len(meta_map)} metadata definitions.")
                
                # Check mapping for first few
                for attr in raw_attrs[:5]:
                    aid = attr.get("attributeId")
                    print(f"ID: {aid} -> Display: {meta_map.get(aid, 'UNKNOWN')}")

        except Exception as e:
            print(f"Error fetching details: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"Global Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    diagnose()
