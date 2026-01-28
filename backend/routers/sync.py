from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from database import get_db
from services.sync_service import get_sync_service, GoogleSyncService
import models, auth

router = APIRouter(
    prefix="/sync",
    tags=["Sync"],
    responses={404: {"description": "Not found"}},
)

@router.post("/{store_id}", response_model=Dict[str, Any])
async def trigger_manual_sync(
    store_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    sync_service: GoogleSyncService = Depends(get_sync_service)
):
    """
    Trigger manual synchronization for a specific store.
    """
    # 1. Permission Check
    # Verify user has access to store_id (Role check or ownership check)
    # For now, simple check:
    if current_user.role != "SUPER_ADMIN":
         # Look up store ownership if necessary
         pass

    # 2. Get Store & Location ID
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    if not store.google_location_id:
         return {"status": "skipped", "message": "Store not connected to Google Business Profile"}

    # 3. Perform Sync
    # Authenticate with User's Token
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        return {"status": "error", "message": "Google account not connected"}
    
    # Refresh if needed (logic duplicated from other routers, should be centralized but handled here for safety)
    from services import google_api 
    from datetime import datetime, timedelta
    
    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()

    # Create Client & Service with User's Token
    client = google_api.GBPClient(connection.access_token)
    service = GoogleSyncService(client)
    
    results = await service.sync_all(db, store_id, store.google_location_id)
    
    # 4. Update models.Store.last_synced_at
    store.last_synced_at = datetime.utcnow() # Use utcnow
    db.commit()
    
    return results
