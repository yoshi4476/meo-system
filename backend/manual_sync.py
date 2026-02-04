from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services.sync_service import GoogleSyncService
from services.google_api import GBPClient
import asyncio
import os

# Mock client for local testing if needed, or use real one if env vars set
# We need to act as a user.
# Find a user with google_connection

def get_real_client(db: Session, store_id: str):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        print("Store not found")
        return None, None
        
    print(f"Store: {store.name} ({store.google_location_id})")
    
    # Find a user connected to this store's company or the store itself who has a google connection
    # For simplicity, let's just find ANY user with a valid google connection for now?
    # No, strictly it should be someone who has access.
    
    users = db.query(models.User).filter(models.User.is_active == True).all()
    connected_user = None
    for u in users:
        if u.google_connection and u.google_connection.access_token:
            connected_user = u
            break
            
    if not connected_user:
        print("No user with Google connection found.")
        return None, None
        
    print(f"Using user: {connected_user.email}")
    client = GBPClient(connected_user.google_connection.access_token)
    return client, store

async def run_sync():
    db = SessionLocal()
    try:
        # Get first store
        store = db.query(models.Store).first()
        if not store:
            print("No stores in DB")
            return

        client, store_obj = get_real_client(db, store.id)
        if not client:
            return

        service = GoogleSyncService(client)
        print("Starting Sync...")
        try:
            results = await service.sync_all(db, store.id, store.google_location_id)
            print("Sync Results:", results)
        except Exception as e:
            print(f"Sync Failed: {e}")
            import traceback
            traceback.print_exc()

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_sync())
