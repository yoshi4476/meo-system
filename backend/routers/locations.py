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
    # 1. Check if we need to fetch
    should_fetch = force_refresh
    
    if not should_fetch:
        # If no data or no timestamp, we must fetch
        if not store.gbp_data or not store.last_synced_at:
            should_fetch = True
        else:
            # Check if cache is expired (e.g. 1 hour)
            if datetime.utcnow() - store.last_synced_at > timedelta(hours=1):
                should_fetch = True
            
    if not should_fetch:
        print(f"DEBUG: Returning cached GBP data for {store.name}")
        return store.gbp_data

    print(f"DEBUG: Fetching fresh GBP data for {store.name} (Force={force_refresh})")

    # Hard Reset if forced: Clear existing data to prevent merge issues
    if force_refresh:
        store.gbp_data = None
        db.commit()

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

        # --- Detailed Sync Implementation ---
        
        # Phone Number
        if details.get("phoneNumbers") and details["phoneNumbers"].get("primaryPhone"):
            store.phone_number = details["phoneNumbers"]["primaryPhone"]
            
        # Website
        if details.get("websiteUri"):
            store.website_url = details["websiteUri"]
            
        # Address Components
        if details.get("postalAddress"):
            addr = details["postalAddress"]
            store.zip_code = addr.get("postalCode")
            store.prefecture = addr.get("administrativeArea")
            
            # City & Address Line 1 logic
            # Combine locality and first address line for "City/Block"
            city_val = addr.get("locality", "")
            address_lines = addr.get("addressLines", [])
            
            if address_lines:
                if city_val:
                    city_val += address_lines[0]
                else:
                    city_val = address_lines[0]
                
                # Address Line 2 (Building name etc)
                if len(address_lines) > 1:
                    store.address_line2 = "\n".join(address_lines[1:])
                else:
                    store.address_line2 = None
            else:
                store.address_line2 = None
                
            store.city = city_val
            
            # Update full address string as fallback/display
            full_addr = f"{store.prefecture or ''}{store.city or ''}{store.address_line2 or ''}"
            store.address = full_addr

        # Regular Hours
        if details.get("regularHours"):
            store.regular_hours = details["regularHours"]
            
        # Attributes
        # Note: 'attributes' are not always in the default readMask. 
        # get_location_details in google_api.py attempts to fetch 'attributes' via metadata or specific mask?
        # Check google_api.py masks. It includes 'attributes' in the list_locations mask but maybe not get_location_details masks.
        # But 'categories' is there. 'attributes' usually requires a specific field mask like "attributes" or "serviceArea".
        # Let's assume it's in details if fetched.
        if details.get("attributes"):
             store.attributes = details["attributes"]
        if details.get("serviceArea"):
             # Sometimes serviceArea is useful too
             pass

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
        # 1. Update Google
        client.update_location(store.google_location_id, data, update_mask)
        
        # 2. Force Refresh from Google to ensure 100% consistency
        # This overwrites store.gbp_data and all local columns (name, address, category, etc.)
        # with exactly what Google has confirmed.
        refreshed_details = get_location_details(store_id, force_refresh=True, db=db, current_user=current_user)
            
        return refreshed_details
    except Exception as e:
        print(f"Update failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
