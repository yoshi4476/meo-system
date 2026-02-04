import sys
import os
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.getcwd())

import models
from database import SessionLocal
from services.google_api import GBPClient
from services.sync_service import GoogleSyncService

db = SessionLocal()

async def main():
    print("--- Starting Insights Debug ---")
    
    # Get first user/store
    user = db.query(models.User).filter(models.User.email.isnot(None)).first() 
    if not user:
        print("No user found")
        return

    store = db.query(models.Store).first()
    if not store:
        print("No store found")
        return

    print(f"User: {user.email}")
    print(f"Store: {store.id}, Location ID: {store.google_location_id}")

    if not user.google_connection:
        print("User has no google connection")
        return

    # Refresh Token if needed (simplified)
    # ...

    client = GBPClient(user.google_connection.access_token)
    service = GoogleSyncService(client)
    
    # Test Insights Sync
    print(f"Running sync_insights for {store.google_location_id}...")
    try:
        result = await service.sync_insights(db, store.id, store.google_location_id)
        print("Result:", result)
    except Exception as e:
        print("FATAL ERROR in sync_insights:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
