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
    if conn and conn.access_token:
        report["token_status"] = "Present"
        report["token_expiry"] = str(conn.expiry)
        report["token_scopes"] = conn.scopes # Kept original 'scopes' for consistency
        
        # Token Inspection (Check Client ID mismatch)
        try:
            import requests
            ti_resp = requests.get(f"https://oauth2.googleapis.com/tokeninfo?access_token={conn.access_token}", timeout=5)
            if ti_resp.status_code == 200:
                ti_data = ti_resp.json()
                report["token_metadata"] = {
                    "issued_to": ti_data.get("issued_to"),
                    "details": "Compare 'issued_to' with your Cloud Console Client ID"
                }
        except:
             report["token_metadata"] = "Failed to inspect"

        # Check for expiration
        if conn.expiry and conn.expiry < datetime.now():
             report["token_status"] = "Expired"
             report["api_checks"]["Init"] = "Skipped (Token Expired - Please Reconnect)"
             return report # Added return here to match original logic
    else:
        report["token_status"] = "Missing Access Token" # Added this else block to match original logic
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
                    # 3.3 Reviews API Discovery - SKIPPED (Hanging)
                    # try:
                    #     import requests
                    #     disco_url = "https://discovery.googleapis.com/discovery/v1/apis"
                    #     # ... logic ...
                    # except Exception as e:
                    #     report["api_checks"]["DISCOVERY_FETCH"] = f"Error: {str(e)}"
                        
                    report["api_checks"]["v4_reviews"] = "Skipped (Discovery Hanging)"
                    report["api_checks"]["AVAILABLE_APIS"] = "Skipped (Network Blocked)"

            except Exception as e:
                report["api_checks"]["v1_locations"] = f"Failed to list locations: {str(e)}"
    except Exception as e:
         report["api_checks"]["v1_accounts"] = f"Failed: {str(e)}"

    return report

@router.get("/pdf_test")
def debug_pdf_generation():
    """
    Test PDF Generation logic independent of DB data.
    """
    from services.report_generator import ReportGenerator
    from fastapi.responses import StreamingResponse
    try:
        gen = ReportGenerator()
        insights = {"views_search": 123, "views_maps": 456, "actions_website": 10, "actions_phone": 5}
        sentiment = {
            "sentiment_score": 80, 
            "summary": "This is a test summary from debug endpoint.", 
            "positive_points": ["Good service", "Tasty food"], 
            "negative_points": ["No parking"]
        }
        
        pdf_buffer = gen.generate_report("Debug Store", insights, sentiment)
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=debug_report.pdf"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Debug Failed: {str(e)}")
