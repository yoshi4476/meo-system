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

    client = google_api.GBPClient(conn.access_token)

    # 3. API Checks
    # 3.1 Accounts (V1)
    try:
        accounts = client.list_accounts()
        report["api_checks"]["v1_accounts"] = f"Success ({len(accounts.get('accounts', []))} accounts)"
        
        # Use first account for next tests
        if accounts.get('accounts'):
            acc_name = accounts['accounts'][0]['name']
            
            # 3.2 Locations (V1)
            try:
                locs = client.list_locations(acc_name)
                report["api_checks"]["v1_locations"] = f"Success ({len(locs.get('locations', []))} locations)"
                
                if locs.get('locations'):
                    # 3.3 Reviews (V4)
                    loc_id = locs['locations'][0]['name'].split('/')[-1]
                    v4_name = f"{acc_name}/locations/{loc_id}"
                    
                    try:
                        reviews = client.list_reviews(v4_name)
                        report["api_checks"]["v4_reviews"] = f"Success ({len(reviews.get('reviews', []))} reviews)"
                    except Exception as e:
                        report["api_checks"]["v4_reviews"] = f"Failed: {str(e)}"
                        
                    except Exception as e:
                        report["api_checks"]["v4_reviews"] = f"Failed: {str(e)}"
                        
                    # Library-based V4 Check (The "Official" Way)
                    try:
                        from googleapiclient.discovery import build
                        from google.oauth2.credentials import Credentials
                        
                        # Create Credentials object
                        creds = Credentials(token=conn.access_token)
                        
                        # Build Service
                        # Note: discovery.build might fail if API is disabled or not found
                        service = build('mybusiness', 'v4', credentials=creds)
                        
                        # Account Info (from name)
                        # accounts/{accountId}/locations/{locationId}
                        # The client lib expects: service.accounts().locations().reviews().list(parent=...).execute()
                        
                        reviews_result = service.accounts().locations().reviews().list(parent=v4_name).execute()
                        report["api_checks"]["LIBRARY_v4_check"] = f"Working! ({len(reviews_result.get('reviews', []))})"
                        
                    except Exception as e:
                         report["api_checks"]["LIBRARY_v4_check"] = f"Error: {str(e)}"

            except Exception as e:
                report["api_checks"]["v1_locations"] = f"Failed: {str(e)}"
    except Exception as e:
         report["api_checks"]["v1_accounts"] = f"Failed: {str(e)}"

    return report
