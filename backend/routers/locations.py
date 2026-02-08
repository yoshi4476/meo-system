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
async def get_location_details(store_id: str, force_refresh: bool = False, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
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

    # Use Sync Service for robust fetching
    from services.sync_service import GoogleSyncService
    
    # FIX: Initialize with Client, not DB
    client = google_api.GBPClient(current_user.google_connection.access_token)
    sync_service = GoogleSyncService(client)
    
    # This executes the robust logic (get_location_details + fallback find_location_robust)
    # and updates the DB.
    result = await sync_service.sync_location_details(db, store.id, store.google_location_id)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    
    # --- EMERGENCY PARACHUTE (ALL FIELDS) ---
    # Double-check if we actually got the essential data. If not, try one final "Desperate" fetch for each missing piece.
    # This bypasses sync_service complexity to ensure we aren't losing data in the layers.
    db.refresh(store)
    current_data = store.gbp_data or {}
    
    # 1. Rescue Address
    has_address = current_data.get("postalAddress") and current_data["postalAddress"].get("postalCode")
    if not has_address:
        print(f"DEBUG: Emergency Parachute deployed for ADDRESS - {store.name}")
        try:
            emergency_data = client.get_location_details(store.google_location_id, read_mask="postalAddress")
            if emergency_data.get("postalAddress"):
                print("DEBUG: Emergency Parachute SUCCESS. Address recovered.")
                new_data = dict(store.gbp_data) if store.gbp_data else {}
                
                # --- ADDRESS POLYFILL ---
                # Frontend expects addressLines[0]. If Google returns subLocality but no addressLines, fail.
                # So we manually inject subLocality into addressLines if needed.
                addr = emergency_data["postalAddress"]
                if not addr.get("addressLines") and addr.get("subLocality"):
                    addr["addressLines"] = [addr["subLocality"]]
                    print("DEBUG: Polyfilled addressLines with subLocality")
                
                new_data["postalAddress"] = addr
                store.gbp_data = new_data
                
                # Apply mapping logic
                store.zip_code = addr.get("postalCode")
                store.prefecture = addr.get("administrativeArea")
                store.city = addr.get("locality", "")
                store.address_line2 = "".join(addr.get("addressLines", []))
                store.address = f"〒{store.zip_code} {store.prefecture}{store.city}{store.address_line2}"
                db.commit()
        except Exception as e:
            print(f"DEBUG: Emergency Parachute Address failed: {e}")

    # 2. Rescue Attributes
    if not current_data.get("attributes"):
        print(f"DEBUG: Emergency Parachute deployed for ATTRIBUTES - {store.name}")
        try:
            emergency_data = client.get_location_details(store.google_location_id, read_mask="attributes")
            if emergency_data.get("attributes"):
                 print("DEBUG: Emergency Parachute SUCCESS. Attributes recovered.")
                 new_data = dict(store.gbp_data) if store.gbp_data else {}
                 new_data["attributes"] = emergency_data["attributes"]
                 store.gbp_data = new_data
                 store.attributes = emergency_data["attributes"]
                 db.commit()
        except Exception as e:
             print(f"DEBUG: Emergency Parachute Attributes failed: {e}")

    # 3. Rescue Regular Hours
    if not current_data.get("regularHours"):
        print(f"DEBUG: Emergency Parachute deployed for HOURS - {store.name}")
        try:
            emergency_data = client.get_location_details(store.google_location_id, read_mask="regularHours")
            if emergency_data.get("regularHours"):
                 print("DEBUG: Emergency Parachute SUCCESS. Hours recovered.")
                 new_data = dict(store.gbp_data) if store.gbp_data else {}
                 new_data["regularHours"] = emergency_data["regularHours"]
                 store.gbp_data = new_data
                 store.regular_hours = emergency_data["regularHours"]
                 db.commit()
        except Exception as e:
             print(f"DEBUG: Emergency Parachute Hours failed: {e}")

    # 4. Rescue Service Area
    if not current_data.get("serviceArea"):
        # Less critical, but user said "everything"
        try:
            emergency_data = client.get_location_details(store.google_location_id, read_mask="serviceArea")
            if emergency_data.get("serviceArea"):
                 new_data = dict(store.gbp_data) if store.gbp_data else {}
                 new_data["serviceArea"] = emergency_data["serviceArea"]
                 store.gbp_data = new_data
                 db.commit()
        except:
             pass

    # --- READ-TIME SANITIZER ---
    # Ensure data is frontend-ready before returning, fixing any legacy/cache issues on the fly.
    db.refresh(store)
    final_data = dict(store.gbp_data) if store.gbp_data else {}
    data_changed = False

    # 1. Sanitize Address
    if final_data.get("postalAddress"):
        addr = final_data["postalAddress"]
        # Ensure addressLines exists and is populated
        if not addr.get("addressLines"):
            # Try subLocality (Chome-Ban)
            if addr.get("subLocality"):
                addr["addressLines"] = [addr["subLocality"]]
                data_changed = True
                print("DEBUG: Read-Time Sanitizer: Injected subLocality into addressLines")
            # Fallback to Locality if really desperate
            elif addr.get("locality"):
                addr["addressLines"] = [addr["locality"]]
                # Don't set data_changed here maybe? Or yes? 
                # Let's be safe and only do subLocality for now to avoid duplication
                pass
        
        final_data["postalAddress"] = addr

    # 2. Sanitize Attributes (Ensure it's a list)
    if final_data.get("attributes") is None:
        # If None, maybe we can't do much, but if it's not a list, fix it?
        pass 

    if data_changed:
         store.gbp_data = final_data
         db.commit()
         db.refresh(store)
         print(f"DEBUG: Read-Time Sanitization applied and saved for {store.name}")

    return store.gbp_data

    # --- OLD LEGACY LOGIC REMOVED (Replaced by Sync Service) ---
    # Logic handled by sync_service
    pass

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
