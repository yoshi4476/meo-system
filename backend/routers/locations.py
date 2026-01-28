from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from pydantic import BaseModel
from typing import Optional, List, Dict

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
)

class LocationUpdate(BaseModel):
    title: Optional[str] = None
    websiteUri: Optional[str] = None
    phoneNumbers: Optional[Dict] = None # {primaryPhone: ...}
    regularHours: Optional[Dict] = None # {periods: [{openDay: ..., openTime: ..., closeDay: ..., closeTime: ...}]}
    
    # Add other fields as needed

@router.get("/{store_id}")
def get_location_details(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get location details directly from Google Business Profile.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Verify access (Placeholder for Phase 2 RBAC)
    if current_user.role == "STORE_USER" and current_user.store_id != store.id:
        raise HTTPException(status_code=403, detail="Not authorized for this store")
    
    # Use user's Google Connection (or system connection if implemented later)
    if not current_user.google_connection:
         raise HTTPException(status_code=400, detail="Google account not connected")
    
    client = google_api.GBPClient(current_user.google_connection.access_token)
    
    try:
        # Fetch detailed location info
        details = client.get_location_details(store.google_location_id)
        
        # Save to DB for caching/display
        store.gbp_data = details
        db.commit()
        
        return details
    except Exception as e:
        print(f"Error fetching GBP details: {e}")
        # Fallback to cached data if available
        if store.gbp_data:
            return store.gbp_data
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{store_id}")
def update_location_details(store_id: str, update_data: LocationUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Update location details on Google Business Profile.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    if not current_user.google_connection:
         raise HTTPException(status_code=400, detail="Google account not connected")
    
    client = google_api.GBPClient(current_user.google_connection.access_token)
    
    # Construct update mask and data
    mask_parts = []
    data = {}
    
    if update_data.title:
        mask_parts.append("title")
        data["title"] = update_data.title
    if update_data.websiteUri:
        mask_parts.append("websiteUri")
        data["websiteUri"] = update_data.websiteUri
    if update_data.phoneNumbers:
        mask_parts.append("phoneNumbers")
        data["phoneNumbers"] = update_data.phoneNumbers
    if update_data.regularHours:
        mask_parts.append("regularHours")
        data["regularHours"] = update_data.regularHours
        
    if not mask_parts:
        return {"message": "No changes detected"}
        
    update_mask = ",".join(mask_parts)
    
    try:
        updated_location = client.update_location(store.google_location_id, data, update_mask)
        
        # Sync back basics to local DB if title changed
        if update_data.title:
            store.name = update_data.title
            db.commit()
            
        return updated_location
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
