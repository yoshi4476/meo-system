
import sys
import os

# Setup path to backend
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BACKEND_DIR)

from database import SessionLocal
import models
from services import google_api

def auto_link():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "7senses.gran.toukou@gmail.com").first()
        if not user or not user.google_connection:
            print("User or Google Connection not found.")
            return

        print(f"User: {user.email}")
        client = google_api.GBPClient(user.google_connection.access_token)
        
        # 1. List Accounts
        print("Listing accounts...")
        accounts_data = client.list_accounts()
        accounts = accounts_data.get("accounts", [])
        print(f"Found {len(accounts)} accounts.")
        
        all_locations = []
        for account in accounts:
            print(f"Checking account: {account['name']}")
            locs_data = client.list_locations(account["name"])
            locs = locs_data.get("locations", [])
            for loc in locs:
                 loc['account_name'] = account['name']
            all_locations.extend(locs)
            
        print(f"Found {len(all_locations)} locations.")
        
        if not all_locations:
            print("No locations found in Google Account.")
            return

        target_location = None
        if len(all_locations) == 1:
            target_location = all_locations[0]
            print("Single location found. Linking automatically.")
        else:
            print("Multiple locations found:")
            for i, loc in enumerate(all_locations):
                print(f"[{i}] {loc['title']} ({loc['name']})")
            # For now, pick the first one or logic match name?
            # Let's pick the one that matches "MEO Cafe" if possible, or just the first one.
            # Given the context, we'll try to match "MEO Cafe" or just take index 0 as fallback.
            target_location = all_locations[0] # Default
            for loc in all_locations:
                if "MEO Cafe" in loc['title']:
                    target_location = loc
                    break
        
        if target_location:
            print(f"Selected Target: {target_location['title']} ({target_location['name']})")
            
            # Update Store
            if user.store_id:
                store = db.query(models.Store).filter(models.Store.id == user.store_id).first()
                if store:
                    print(f"Updating Store {store.id}...")
                    store.google_location_id = target_location['name'] # "locations/..."
                    store.name = target_location['title']
                    db.commit()
                    print("SUCCESS: Store linked.")
                else:
                    print("Store record missing despite ID being set.")
            else:
                print("User has no store_id to update.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    auto_link()
