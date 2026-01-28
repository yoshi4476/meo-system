import os
import sys
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from services.google_api import GBPClient, refresh_access_token # Verify imports
import json

# Setup DB Connection
# Setup DB Connection
# Try root sql_app.db first (likely what is used if running from root)
db_path = "sql_app.db"
if not os.path.exists(db_path):
    db_path = "backend/sql_app.db"
    
if not os.path.exists(db_path):
    print("[ERROR] Could not find sql_app.db in backend/ or root.")
    sys.exit(1)

print(f"[INFO] Using Database: {db_path}")
DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def diagnose():
    print("--- Starting Sync Diagnosis ---")
    db = SessionLocal()
    
    # Check if DB has any users at all
    user_count = db.query(models.User).count()
    print(f"[INFO] Total Users in DB: {user_count}")
    
    # 1. Fetch Connection
    connection = db.query(models.GoogleConnection).first()
    if not connection:
        print("[ERROR] No Google Connection found in DB. User has not linked account.")
        # Check if any user exists
        if user_count > 0:
             print("  > Users exist but none have Google connected.")
        return

    print(f"[INFO] Found connection for user_id: {connection.user_id}")
    token = connection.access_token

    # 2. Check Expiry/Refresh
    print(f"[INFO] Token Expiry: {connection.expiry}")
    # Force refresh for valid test
    if connection.refresh_token:
        try:
            print("[INFO] Attempting Token Refresh...")
            # We need client_id/secret from env
            if not os.getenv("GOOGLE_CLIENT_ID"):
                # Try to load from .env manually if not set
                try:
                    from dotenv import load_dotenv
                    load_dotenv()
                except:
                    pass
            
            # Re-check
            if not os.getenv("GOOGLE_CLIENT_ID"):
                 print("[WARN] GOOGLE_CLIENT_ID not found in env. Refresh might fail if not using stored client_id.")
            
            # Assuming google_api uses env vars
            new_tokens = refresh_access_token(connection.refresh_token)
            token = new_tokens.get("access_token")
            print("[SUCCESS] Token Refreshed.")
        except Exception as e:
            print(f"[WARN] Refresh Failed: {e}")
            # Continue with old token, might work
    
    client = GBPClient(token)

    # 3. Test V1 Accounts (New API)
    print("\n--- Testing V1 Accounts API (mybusinessaccountmanagement) ---")
    first_account = None
    try:
        accounts = client.list_accounts()
        print(f"[SUCCESS] Accounts Found: {len(accounts.get('accounts', []))}")
        if accounts.get('accounts'):
            first_account = accounts['accounts'][0]
            print(f"  > Account Name: {first_account['name']}") # accounts/123
            print(f"  > Account Title: {first_account.get('accountName')}")
    except Exception as e:
        print(f"[ERROR] V1 Accounts API Failed: {e}")
        # If this fails, everything fails
        return

    if not first_account:
        print("[ERROR] No accounts returned. Cannot proceed.")
        return

    account_name = first_account['name'] # accounts/XXX

    # 4. Test V1 Locations (New API)
    print("\n--- Testing V1 Locations API (mybusinessbusinessinformation) ---")
    first_location = None
    try:
        locs = client.list_locations(account_name)
        print(f"[SUCCESS] Locations Found: {len(locs.get('locations', []))}")
        if locs.get('locations'):
            first_location = locs['locations'][0]
            print(f"  > Location Name: {first_location['name']}") # locations/YYY
            print(f"  > Location Title: {first_location.get('title')}")
    except Exception as e:
        print(f"[ERROR] V1 Locations API Failed: {e}")

    # 5. Test V4 Reviews (Old/Mixed API)
    print("\n--- Testing V4 Reviews API (mybusiness.googleapis.com) ---")
    
    if first_location:
        # Construct v4 Name
        # We need location ID from "locations/YYY" -> "YYY"
        loc_id = first_location['name'].split('/')[-1]
        v4_name = f"{account_name}/locations/{loc_id}"
        print(f"  > Constructed V4 Name: {v4_name}")
        
        try:
            reviews = client.list_reviews(v4_name)
            count = len(reviews.get('reviews', []))
            print(f"[SUCCESS] V4 Reviews API Works! Found {count} reviews.")
        except Exception as e:
            print(f"[ERROR] V4 Reviews API Failed: {e}")
            if "403" in str(e):
                print("  > HINT: Enable 'Google My Business API' in Cloud Console.")
                print("  > HINT: Check if user has correct role.")
            if "404" in str(e):
                print("  > HINT: Endpoint URL might be wrong or API deprecated.")
    else:
        print("[SKIP] No location found to test reviews.")

    # 6. Test V1 Q&A (Wait, we need to know the endpoint)
    # Our code uses v4 for Q&A currently.
    # Let's test if V4 Q&A works
    print("\n--- Testing V4 Q&A API ---")
    if first_location:
         try:
            qa = client.list_questions(v4_name)
            print(f"[SUCCESS] V4 Q&A API Works! Found {len(qa.get('questions', []))} questions.")
         except Exception as e:
            print(f"[ERROR] V4 Q&A API Failed: {e}")


    print("\n--- Diagnosis Complete ---")

if __name__ == "__main__":
    diagnose()
