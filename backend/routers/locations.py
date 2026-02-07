from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
)

class LocationUpdate(BaseModel):
    title: Optional[str] = None
    storeCode: Optional[str] = None
    websiteUri: Optional[str] = None
    phoneNumbers: Optional[Dict] = None # {primaryPhone: ...}
    regularHours: Optional[Dict] = None # {periods: [{openDay: ..., openTime: ..., closeDay: ..., closeTime: ...}]}
    categories: Optional[Dict] = None # {primaryCategory: {name: "categories/gcid:..."}}
    profile: Optional[Dict] = None # {description: "..."}
    postalAddress: Optional[Dict] = None # {postalCode: ..., regionCode: "JP", ...}
    labels: Optional[List[str]] = None
    openInfo: Optional[Dict] = None # {openingDate: {year: ..., month: ..., day: ...}}
    
    # Add other fields as needed

@router.get("/")
def list_available_locations(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    List all stores accessible to the current user.
    Used for Sidebar store selector.
    """
    if current_user.role == "SUPER_ADMIN":
        stores = db.query(models.Store).all()
        return [{"id": s.id, "name": s.name} for s in stores]
        
    elif current_user.role == "COMPANY_ADMIN":
        if not current_user.company_id:
            return []
        stores = db.query(models.Store).filter(models.Store.company_id == current_user.company_id).all()
        return [{"id": s.id, "name": s.name} for s in stores]
        
    else: # STORE_USER
        if not current_user.store_id:
            return [] # Or return empty
        store = db.query(models.Store).filter(models.Store.id == current_user.store_id).first()
        if store:
            return [{"id": store.id, "name": store.name}]
        return []

@router.get("/{store_id}")
def get_location_details(store_id: str, force_refresh: bool = False, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
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
    
    # Caching Logic
    # 1. Check if we have cached data and it is recent (< 1 hour)
    should_fetch = force_refresh
    if not should_fetch and store.gbp_data and store.last_synced_at:
        # Check if cache is fresh (e.g. 1 hour)
        if datetime.utcnow() - store.last_synced_at < timedelta(hours=1):
            should_fetch = False
            
    if not should_fetch:
        return store.gbp_data

    client = google_api.GBPClient(current_user.google_connection.access_token)
    
    try:
        # Fetch detailed location info
        details = client.get_location_details(store.google_location_id)
        
        # Save to DB for caching/display
        # Save to DB for caching/display
        store.gbp_data = details
        store.last_synced_at = datetime.utcnow()

        # Update core fields from GBP data to ensure consistency
        if details.get("title"):
             store.name = details.get("title")
        
        # Address
        if details.get("postalAddress"):
             addr = details["postalAddress"]
             addr_str = f"{addr.get('administrativeArea', '')}{addr.get('locality', '')}"
             if addr.get("addressLines"):
                 addr_str += "".join(addr["addressLines"])
             store.address = addr_str
        
        # Category
        if details.get("categories") and details["categories"].get("primaryCategory"):
             store.category = details["categories"]["primaryCategory"].get("displayName")
        
        # Description
        if details.get("profile") and details["profile"].get("description"):
             store.description = details["profile"]["description"]

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
    if update_data.storeCode:
        mask_parts.append("storeCode")
        data["storeCode"] = update_data.storeCode
    if update_data.websiteUri:
        mask_parts.append("websiteUri")
        data["websiteUri"] = update_data.websiteUri
    if update_data.phoneNumbers:
        mask_parts.append("phoneNumbers")
        data["phoneNumbers"] = update_data.phoneNumbers
    if update_data.regularHours:
        mask_parts.append("regularHours")
        # Convert HH:MM strings to TimeOfDay objects for Google V1 API
        periods = []
        if update_data.regularHours.periods:
            for p in update_data.regularHours.periods:
                period_data = {
                     "openDay": p.openDay,
                     "closeDay": p.closeDay
                }
                
                # Parse Open Time
                if p.openTime and isinstance(p.openTime, str):
                    try:
                        h, m = map(int, p.openTime.split(':'))
                        period_data["openTime"] = {"hours": h, "minutes": m, "seconds": 0, "nanos": 0}
                    except:
                        pass # Skip invalid time
                
                # Parse Close Time
                if p.closeTime and isinstance(p.closeTime, str):
                    try:
                        h, m = map(int, p.closeTime.split(':'))
                        period_data["closeTime"] = {"hours": h, "minutes": m, "seconds": 0, "nanos": 0}
                    except:
                        pass
                
                if "openTime" in period_data and "closeTime" in period_data:
                    periods.append(period_data)
        
        data["regularHours"] = {"periods": periods}
    if update_data.categories:
        mask_parts.append("categories")
        data["categories"] = update_data.categories
    if update_data.profile:
        mask_parts.append("profile")
        data["profile"] = update_data.profile
    if update_data.postalAddress:
        mask_parts.append("postalAddress")
        data["postalAddress"] = update_data.postalAddress
    if update_data.labels is not None:
        mask_parts.append("labels")
        data["labels"] = update_data.labels
    if update_data.openInfo:
        mask_parts.append("openInfo")
        data["openInfo"] = update_data.openInfo
        
    if not mask_parts:
        return {"message": "No changes detected"}
        
    update_mask = ",".join(mask_parts)
    
    try:
        updated_location = client.update_location(store.google_location_id, data, update_mask)
        
        # Update Cache immediately so UI reflects changes
        store.gbp_data = updated_location
        store.last_synced_at = datetime.utcnow()
        
        # Sync back basics to local DB if title changed
        if update_data.title:
            store.name = update_data.title
        
        # Sync description
        if update_data.profile and "description" in update_data.profile:
             store.description = update_data.profile["description"]

        # Sync address (flattened for simple DB storage if needed, but currently address is just String or JSON)
        if update_data.postalAddress:
             # Basic update for list view
             addr_str = f"{update_data.postalAddress.get('administrativeArea', '')}{update_data.postalAddress.get('locality', '')}"
             if update_data.postalAddress.get('addressLines'):
                 addr_str += "".join(update_data.postalAddress['addressLines'])
             store.address = addr_str

        # Sync Category
        if update_data.categories and update_data.categories.get("primaryCategory"):
             store.category = update_data.categories["primaryCategory"].get("name") 
             # Ideally we fetch from response if available
             if updated_location.get("categories") and updated_location["categories"].get("primaryCategory"):
                 store.category = updated_location["categories"]["primaryCategory"].get("displayName")
        
        # Sync Website (Future Proof)
        # if update_data.websiteUri: ...

        db.commit()
            
        return updated_location
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
