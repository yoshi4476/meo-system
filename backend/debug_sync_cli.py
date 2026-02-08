
import os
import sys
import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
import models
from services import google_api
from services.sync_service import GoogleSyncService

# Mock user ID if needed, or list users to find the right one
# For production safety, we'll list users and ask which one to sync

async def debug_sync():
    db: Session = SessionLocal()
    try:
        print("--- Debug Sync Tool ---")
        
        # RAW TABLE DUMP
        print("\n--- Raw GoogleConnection Table ---")
        conns = db.query(models.GoogleConnection).all()
        for c in conns:
            print(f"ID: {c.id}, UserID: {c.user_id}, AccessToken: {c.access_token[:10]}...")
            
        print("\n--- User List ---")
        users = db.query(models.User).all()
        for i, user in enumerate(users):
            store_name = user.store.name if user.store else "No Store"
            google_status = "Connected" if user.google_connection else "Not Connected"
            print(f"{i+1}. {user.email} (Store: {store_name}, Google: {google_status})")
        
        # In a real CLI we'd ask input, but here we'll just pick the first connected user
        # or the one that seems most relevant.
        target_user = None
        for user in users:
            if user.google_connection and user.store:
                target_user = user
                break
        
        if not target_user:
            print("No user with both Google Connection and Store found.")
            return

        print(f"\nTargeting User: {target_user.email}")
        print(f"Store ID: {target_user.store_id}")
        print(f"Google Location ID: {target_user.store.google_location_id}")
        
        if not target_user.google_connection.access_token:
            print("Error: No access token.")
            return

        # Initialize Service
        print("\nInitializing GoogleSyncService...")
        try:
            client = google_api.GBPClient(target_user.google_connection.access_token)
            service = GoogleSyncService(client)
            
            # 1. Test basic connectivity
            print("Testing basic connectivity (get_user_info)...")
            try:
                info = client.get_user_info()
                print(f"User Info: {info.get('email')}")
            except Exception as e:
                print(f"Connectivity check failed: {e}")
                
            # 2. Test Location Details Sync
            print("\nSyncing Location Details...")
            location_id = target_user.store.google_location_id
            if not location_id:
                print("Error: No Google Location ID in store.")
                return

            result = await service.sync_location_details(db, target_user.store_id, location_id)
            print(f"Sync Result: {result}")
            
            # Check DB persistence
            db.refresh(target_user.store)
            print(f"\nStore Name in DB: {target_user.store.name}")
            print(f"Store Address in DB: {target_user.store.address}")
            print(f"Store Hours in DB: {target_user.store.regular_hours}")
            print(f"GBP Data blob size: {len(str(target_user.store.gbp_data))} chars")

        except Exception as e:
            print(f"\nCRITICAL ERROR during sync: {e}")
            import traceback
            traceback.print_exc()

        # RAW TABLE DUMP
        print("\n--- Raw GoogleConnection Table ---")
        conns = db.query(models.GoogleConnection).all()
        for c in conns:
            print(f"ID: {c.id}, UserID: {c.user_id}, AccessToken: {c.access_token[:10]}...")
            
        print("\n--- User Table IDs ---")
        for u in users:
             print(f"User ID: {u.id}, Email: {u.email}")


    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(debug_sync())
