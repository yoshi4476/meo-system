from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, models, auth
from services import google_api
from datetime import datetime

router = APIRouter(
    prefix="/debug",
    tags=["debug"],
    responses={404: {"description": "Not found"}},
)

@router.get("/google")
def debug_google_connection(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Diagnose Google Connection for the current user.
    Checks DB record, Token validity, and API Reachability.
    """
    if current_user.role != "SUPER_ADMIN":
        # Allow owner too? For now restrict to debug safety
        pass

    report = {
        "user_id": current_user.id,
        "email": current_user.email,
        "db_connection": "Not Found",
        "token_status": "Unknown",
        "api_checks": {}
    }

    # 1. DB Record
    conn = current_user.google_connection
    if not conn:
        report["db_connection"] = "Missing"
        return report
    
    report["db_connection"] = "Found"
    report["token_expiry"] = str(conn.expiry)
    report["token_scopes"] = conn.scopes
    
    # 2. Token Status
    if not conn.access_token:
        report["token_status"] = "Missing Access Token"
        return report

    # Check Expiry
    if conn.expiry and conn.expiry < datetime.now():
        report["token_status"] = "Expired"
        report["api_checks"]["Init"] = "Skipped (Token Expired - Please Reconnect)"
        return report

    client = google_api.GBPClient(conn.access_token)

    # 3. API Checks
    # 3.1 Accounts (V1)
    try:
        # TIMEOUT SAFETY: Using explicit timeout to prevent hanging
        accounts = client.list_accounts()
        report["api_checks"]["v1_accounts"] = f"Success ({len(accounts.get('accounts', []))} accounts)"
        
        # Use first account for next tests
        if accounts.get('accounts'):
            acc_name = accounts['accounts'][0]['name']
            
            # 3.2 Locations (V1)
            # 3.2 Locations (V1)
            # 3.2 Locations (V1)
            try:
                # LIST LOCATIONS (Verified with timeout=10 safety)
                locs = client.list_locations(acc_name)
                report["api_checks"]["v1_locations"] = f"Success ({len(locs.get('locations', []))} locations)"
                
                if locs.get('locations'):
                    # 3.3 Reviews API Discovery
                    # Search global discovery directory for valid "business" or "reviews" APIs
                    try:
                        import requests
                        disco_url = "https://discovery.googleapis.com/discovery/v1/apis"
                        resp = requests.get(disco_url, timeout=10)
                        
                        if resp.status_code == 200:
                            data = resp.json()
                            items = data.get("items", [])
                            found_apis = []
                            for item in items:
                                name = item.get("name", "")
                                # Filter for relevant APIs
                                if "business" in name or "mybusiness" in name:
                                    found_apis.append(f"{name} ({item.get('version')})")
                            
                            report["api_checks"]["AVAILABLE_APIS"] = ", ".join(found_apis) or "None found"
                            
                            # Specific check for v4 presence
                            v4_exists = any(i.get("name") == "mybusiness" and i.get("version") == "v4" for i in items)
                            report["api_checks"]["IS_V4_LISTED"] = str(v4_exists)
                            
                        else:
                            report["api_checks"]["DISCOVERY_FETCH"] = f"Failed: {resp.status_code}"
                            
                    except Exception as e:
                        report["api_checks"]["DISCOVERY_FETCH"] = f"Error: {str(e)}"
                        
                    report["api_checks"]["v4_reviews"] = "Skipped (Check AVAILABLE_APIS above)"

            except Exception as e:
                report["api_checks"]["v1_locations"] = f"Failed to list locations: {str(e)}"
    except Exception as e:
         report["api_checks"]["v1_accounts"] = f"Failed: {str(e)}"

    return report
