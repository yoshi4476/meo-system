import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import models

def diagnose():
    print("--- STARTING PRODUCTION DIAGNOSIS ---")
    
    db = database.SessionLocal()
    try:
        # 1. Check Schema Columns
        print("\n[1] Checking Database Schema (stores table)...")
        try:
            # SQLite specific
            columns = db.execute(text("PRAGMA table_info(stores)")).fetchall()
            col_names = [row[1] for row in columns]
            print(f"Existing Columns: {col_names}")
            
            required = ['phone_number', 'website_url', 'regular_hours', 'attributes', 'description']
            missing = [c for c in required if c not in col_names]
            
            if missing:
                print(f"CRITICAL: Missing columns found: {missing}")
                print("ACTION: Migration is required.")
            else:
                print("SUCCESS: All required columns appear to be present.")
        except Exception as e:
            print(f"Error checking schema: {e}")

        # 2. Check Store Record
        print("\n[2] Checking Store Record...")
        store = db.query(models.Store).first()
        if not store:
            print("CRITICAL: No store record found in DB.")
            return
        
        print(f"Store ID: {store.id}")
        print(f"Store Name: {store.name}")
        print(f"GBP ID: {store.google_location_id}")
        print(f"Last Synced: {store.last_synced_at}")
        
        print("\n--- Current Data in DB ---")
        print(f"Description: {store.description}")
        print(f"Phone: {store.phone_number}")
        print(f"Website: {store.website_url}")
        print(f"Hours: {str(store.regular_hours)[:100]}...")
        
        # 3. Check User & Token
        print("\n[3] Checking User & Google Connection...")
        user = db.query(models.User).filter(models.User.store_id == store.id).first()
        if not user:
            print("CRITICAL: No user found linked to this store.")
            return
            
        print(f"User Email: {user.email}")
        if not user.google_connection:
            print("CRITICAL: User has no GoogleConnection record.")
            return
            
        print("SUCCESS: User has GoogleConnection.")
        
        # 4. Dry Run Sync (Live Fetch)
        print("\n[4] Attempting Live Google API Fetch...")
        from services import google_api
        try:
            client = google_api.GBPClient(user.google_connection.access_token)
            details = client.get_location_details(store.google_location_id)
            print("SUCCESS: API call succeeded.")
            print(f"API Title: {details.get('title')}")
            print(f"API Phone: {details.get('phoneNumbers')}")
            print(f"API Website: {details.get('websiteUri')}")
            
        except Exception as e:
            print(f"CRITICAL: API Fetch failed: {e}")

    finally:
        db.close()
        print("\n--- DIAGNOSIS COMPLETE ---")

if __name__ == "__main__":
    diagnose()
