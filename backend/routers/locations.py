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
    # AND the Emergency Parachute + Sanitizer within the service itself.
    result = await sync_service.sync_location_details(db, store.id, store.google_location_id)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
        
    # Re-fetch from DB to get the updated data
    db.refresh(store)
    return store.gbp_data

    # --- OLD LEGACY LOGIC REMOVED (Replaced by Sync Service) ---
    # Logic handled by sync_service
    pass

@router.patch("/{store_id}")
async def update_location_details(store_id: str, update_data: LocationUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Update location details on Google Business Profile with STRICT validation and verification.
    """
    # 1. AUTH & CONNECTION CHECK
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    connection = current_user.google_connection
    if not connection:
         raise HTTPException(status_code=400, detail="Google account not connected")

    # 2. TOKEN REFRESH (Pre-emptive)
    if connection.expiry and connection.expiry < datetime.utcnow() + timedelta(minutes=10) and connection.refresh_token:
        try:
             new_tokens = google_api.refresh_access_token(connection.refresh_token)
             connection.access_token = new_tokens.get("access_token")
             connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
             db.commit()
             print("DEBUG: Token refreshed pre-emptively for update.")
        except Exception:
             raise HTTPException(status_code=401, detail="Google認証の更新に失敗しました。再ログインしてください。")
    
    client = google_api.GBPClient(connection.access_token)
    
    # 3. ID VERIFICATION (Handshake)
    try:
        client.get_location_details(store.google_location_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Google上の店舗IDが無効です。設定画面で店舗を再選択してください。")

    # 4. CONSTRUCT PAYLOAD & MASK
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
        
    # --- TIME PARSING FIX ---
    if update_data.regularHours:
        mask_parts.append("regularHours")
        # specific transformation for periods if they are strings
        rh = update_data.regularHours
        if "periods" in rh and isinstance(rh["periods"], list):
            new_periods = []
            for p in rh["periods"]:
                # p is expected to be {openDay, openTime, closeDay, closeTime}
                # Check if openTime/closeTime are strings "HH:MM"
                new_p = p.copy()
                
                def to_time_of_day(t_val):
                    if isinstance(t_val, str) and ":" in t_val:
                        try:
                            h, m = map(int, t_val.split(":"))
                            return {"hours": h, "minutes": m, "seconds": 0, "nanos": 0}
                        except:
                            return t_val # Fallback
                    return t_val

                if "openTime" in new_p: new_p["openTime"] = to_time_of_day(new_p["openTime"])
                if "closeTime" in new_p: new_p["closeTime"] = to_time_of_day(new_p["closeTime"])
                new_periods.append(new_p)
            rh["periods"] = new_periods
            
        data["regularHours"] = rh
        
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
        # 5. Execute Update
        print(f"DEBUG: Sending Update: mask={update_mask} data={data}")
        client.update_location(store.google_location_id, data, update_mask)
        
        # 6. Read-After-Write Verification
        print("DEBUG: Verifying update by fetching fresh data...")
        refreshed_details = await get_location_details(store_id, force_refresh=True, db=db, current_user=current_user)
            
        return refreshed_details
    except Exception as e:
        print(f"Update failed: {e}")
        # IMPORTANT: Raise error so frontend knows it failed!
        error_detail = str(e)
        if hasattr(e, 'response') and e.response is not None:
             try: error_detail = f"{error_detail} | Google API: {e.response.text}"
             except: pass
        raise HTTPException(status_code=400, detail=f"Update failed: {error_detail}")
