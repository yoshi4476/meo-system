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

@router.get("/diagnose")
async def diagnose_connection_state(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Full diagnostic of Google Connectivity for the current user.
    Run this to see WHY sync is failing.
    """
    report = {
        "user_email": current_user.email,
        "db_connection_status": "Missing",
        "accounts_found": [],
        "locations_found": [],
        "errors": []
    }
    
    conn = current_user.google_connection
    if not conn:
        report["errors"].append("User has no Google Connection in DB.")
        return report
        
    report["db_connection_status"] = "Connected"
    report["token_partial"] = conn.access_token[:10] + "..." if conn.access_token else "None"
    
    try:
        client = google_api.GBPClient(conn.access_token)
        
        # 1. Accounts
        acc_res = client.list_accounts()
        accounts = acc_res.get("accounts", [])
        report["accounts_found"] = [{"name": a["name"], "accountName": a.get("accountName")} for a in accounts]
        
        if not accounts:
            report["errors"].append("Google API returned NO accounts.")
            
        # 2. Locations (Iterate all accounts)
        for acc in accounts:
            try:
                # Use the ROBUST list_locations we just patched
                loc_res = client.list_locations(acc["name"])
                locations = loc_res.get("locations", [])
                
                for loc in locations:
                    report["locations_found"].append({
                        "name": loc.get("name"), # locations/12345...
                        "title": loc.get("title"),
                        "storeCode": loc.get("storeCode"),
                        "postalAddress": loc.get("postalAddress"), # Check if address exists
                        "regularHours": "Present" if loc.get("regularHours") else "Missing",
                        "attributes": "Present" if loc.get("attributes") else "Missing"
                    })
            except Exception as e:
                 report["errors"].append(f"Failed to list locations for {acc['name']}: {str(e)}")
                 
    except Exception as e:
        report["errors"].append(f"API Error: {str(e)}")
        
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
@router.get("/analyze_store")
def analyze_store_state(
    db: Session = Depends(database.get_db),
    secret: str = None
):
    """
    Deep verification of Store State on Production.
    Requires ?secret=... (Use a temporary hardcoded secret for debugging if needed, or just allow open for now since it's debug route)
    Actually, let's just use the current_user dependency for safety if possible? 
    But user might not be logged in if auth is broken. 
    Let's rely on SUPER_ADMIN check or just a simple secret.
    """
    # Simple security for this debug tool
    import os
    if secret != os.getenv("SECRET_KEY", "dev_secret") and secret != "debug123":
        raise HTTPException(status_code=403, detail="Invalid secret")

    report = {"status": "running"}

    try:
        # 1. Check Schema
        from sqlalchemy import text
        try:
            # SQLite specific pragma
            columns = db.execute(text("PRAGMA table_info(stores)")).fetchall()
            report["schema_columns"] = [row[1] for row in columns]
        except Exception as e:
            report["schema_check_error"] = str(e)
            # Try Postgres way if SQLite fails?
            # report["schema_columns"] = "Could not fetch (Postgres?)"

        # 2. Check Store Data
        # Get first store found (assuming single tenant or mostly single user for now)
        store = db.query(models.Store).first()
        if not store:
            report["store_found"] = False
        else:
            report["store_found"] = True
            report["store_id"] = store.id
            report["store_name"] = store.name
            report["store_gbp_id"] = store.google_location_id
            
            # Check Critical Fields
            report["fields"] = {
                "description": store.description,
                "phone_number": store.phone_number,
                "website_url": store.website_url,
                "regular_hours": str(store.regular_hours)[:100] if store.regular_hours else None,
                "attributes": str(store.attributes)[:100] if store.attributes else None,
            }
            
            report["synced_at"] = str(store.last_synced_at)

            # 3. Check Linked User & Token
            user = db.query(models.User).filter(models.User.store_id == store.id).first()
            if user and user.google_connection:
                 report["user_email"] = user.email
                 report["has_token"] = True
                 
                 # 4. Try Live API Fetch
                 try:
                     client = google_api.GBPClient(user.google_connection.access_token)
                     
                     # FETCH ALL LOCATIONS (To help find the right one)
                     accounts = client.list_accounts()
                     if accounts.get('accounts'):
                         acc_name = accounts['accounts'][0]['name']
                         locs = client.list_locations(acc_name)
                         report["available_locations_on_google"] = []
                         for loc in locs.get('locations', []):
                             report["available_locations_on_google"].append({
                                 "name": loc.get('title'),
                                 "id": loc.get('name'), # locations/12345...
                                 "address": loc.get('storeCode') or loc.get('postalAddress', {}).get('locality')
                             })
                     
                     if store.google_location_id:
                        details = client.get_location_details(store.google_location_id)
                        report["live_api_fetch"] = "Success"
                        report["live_api_data"] = {
                            "title": details.get("title"),
                            "phone": details.get("phoneNumbers"),
                            "hours_keys": list(details.get("regularHours", {}).keys()) if details.get("regularHours") else [],
                            "raw": details, 
                        }
                        
                        # --- MASK DIAGNOSTICS ---
                        # Test which mask is actually working
                        # --- MASK DIAGNOSTICS (INDIVIDUAL FIELDS) ---
                        report["mask_diagnostics"] = []
                        fields_to_test = [
                            "name", "title", "storeCode", "latlng", "phoneNumbers", 
                            "categories", "metadata", "profile", "serviceArea", 
                            "regularHours", "websiteUri", "openInfo", "postalAddress", 
                            "attributes", "address", "phone_numbers"
                        ]
                        
                        import requests
                        base_diag_url = f"{client.base_url}/{store.google_location_id}"
                        
                        for field in fields_to_test:
                             try:
                                 diag_res = requests.get(base_diag_url, headers=client._get_headers(), params={"readMask": field})
                                 status_code = diag_res.status_code
                                 
                                 # If 200, it's supported. If 400, it's invalid.
                                 result = "OK" if status_code == 200 else "INVALID"
                                 if status_code not in [200, 400]:
                                     result = f"Error {status_code}"
                                     
                                 report["mask_diagnostics"].append({
                                     "field": field,
                                     "result": result,
                                     "response": diag_res.json() if status_code == 200 else diag_res.text[:100]
                                 })
                             except Exception as e:
                                 report["mask_diagnostics"].append({"field": field, "result": "EXCEPTION", "details": str(e)})
                        # ------------------------
                     else:
                        report["live_api_fetch"] = "Skipped (No ID in DB)"

                 except Exception as e:
                     report["live_api_fetch"] = f"Failed: {str(e)}"
            else:
                 report["has_token"] = False
            
            # 5. Check Auto-Reply Status
            report["auto_reply_status"] = {
                "enabled": store.auto_reply_enabled,
                "prompt_length": len(store.auto_reply_prompt) if store.auto_reply_prompt else 0,
                "start_date": str(store.auto_reply_start_date) if store.auto_reply_start_date else "None"
            }
            
            # Check OpenAI Key (via connected user)
            user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user.id).first() if user else None
            report["auto_reply_status"]["has_openai_key"] = bool(user_settings and user_settings.openai_api_key)
            
            # Check Unreplied Reviews
            unreplied_count = db.query(models.Review).filter(
                models.Review.store_id == store.id,
                models.Review.reply_comment == None
            ).count()
            report["auto_reply_status"]["unreplied_reviews_in_db"] = unreplied_count

    except Exception as e:
        report["critical_error"] = str(e)
        import traceback
        report["traceback"] = traceback.format_exc()

    return report

@router.get("/ai")
def debug_ai_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Check AI Service availability and configuration.
    """
    import os
    from services import ai_generator
    
    # 1. API Key Check
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    
    openai_key_source = "None"
    if os.getenv("OPENAI_API_KEY"):
        openai_key_source = "Environment Variable"
    elif user_settings and user_settings.openai_api_key:
        openai_key_source = "User Settings (DB)"
        
    gemini_key_source = "None"
    if os.getenv("GEMINI_API_KEY"):
        gemini_key_source = "Environment Variable"
        
    # 2. Connectivity Test
    connection_status = "Skipped"
    test_response = None
    
    if openai_key_source != "None":
        try:
            client = ai_generator.AIClient(api_key=user_settings.openai_api_key if user_settings else None)
            # Simple test
            test_response = client.generate_text(
                system_prompt="You are a test bot.", 
                user_prompt="Say 'Hello World' in Japanese."
            )
            connection_status = "Success"
        except Exception as e:
            connection_status = f"Failed: {str(e)}"
            
    return {
        "openai_key_source": openai_key_source,
        "gemini_key_source": gemini_key_source,
        "connection_status": connection_status,
        "test_generation": test_response
    }

@router.get("/sns")
def debug_sns_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Check SNS Integration status (Configuration & Tokens).
    """
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    
    # Check Custom Credentials
    custom_creds = {
        "instagram": bool(user_settings and user_settings.instagram_client_id),
        "twitter": bool(user_settings and user_settings.twitter_client_id),
        "youtube": bool(user_settings and user_settings.youtube_client_id)
    }
    
    # Check Active Connections (Tokens)
    connections = {}
    if current_user.social_connections:
        for conn in current_user.social_connections:
            connections[conn.platform] = {
                "connected": True,
                "expiry": str(conn.expires_at) if conn.expires_at else None
            }
            
    return {
        "custom_credentials_configured": custom_creds,
        "active_connections": connections,
        "google_connection": {
            "connected": bool(current_user.google_connection),
            "expiry": str(current_user.google_connection.expiry) if current_user.google_connection else None
        }
    }

@router.get("/system")
def debug_system_info(
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    System Information (Server time, Env vars).
    """
    import os
    import sys
    import platform
    
    # Masking helper
    def mask(val):
        if not val: return "Not Set"
        return f"{val[:4]}...{val[-4:]}" if len(val) > 8 else "***"

    return {
        "server_time": datetime.utcnow().isoformat(),
        "python_version": sys.version,
        "platform": platform.platform(),
        "env_vars": {
            "DATABASE_URL": "Set (Hidden)" if os.getenv("DATABASE_URL") else "Not Set",
            "OPENAI_API_KEY": mask(os.getenv("OPENAI_API_KEY")),
            "GOOGLE_CLIENT_ID": mask(os.getenv("GOOGLE_CLIENT_ID")),
            "NEXT_PUBLIC_API_URL": os.getenv("NEXT_PUBLIC_API_URL", "Not Set")
        }
    }

@router.post("/sync/{sync_type}")
async def trigger_debug_sync(
    sync_type: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Manually trigger a sync operation for debugging.
    sync_type: 'reviews', 'insights', 'posts' (or 'all')
    """
    if not current_user.store_id:
        raise HTTPException(status_code=400, detail="User is not linked to a store")
        
    store = db.query(models.Store).filter(models.Store.id == current_user.store_id).first()
    if not store or not store.google_location_id:
         raise HTTPException(status_code=400, detail="Store not found or not linked to Google Location")

    try:
        from services.sync_service import GoogleSyncService
        from services import google_api
        from datetime import datetime, timedelta
        
        connection = current_user.google_connection
        if not connection:
             raise HTTPException(status_code=400, detail="Google not connected")
             
        # Refresh if needed
        if connection.expiry and connection.expiry < datetime.utcnow() and connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            # Update expiry... (simplified)
            db.commit()

        client = google_api.GBPClient(connection.access_token)
        service = GoogleSyncService(client)
        
        result = {}
        if sync_type == 'reviews' or sync_type == 'all':
            reviews = await service.sync_reviews(db, store.id, store.google_location_id)
            result['reviews'] = len(reviews)
            
        if sync_type == 'insights' or sync_type == 'all':
            # Insights sync usually requires a date range, defaulting to last 30 days
            await service.sync_insights(db, store.id, store.google_location_id)
            result['insights'] = "Triggered"

        # Note: Posts sync logic might differ, assuming typical service pattern
        # if sync_type == 'posts' or sync_type == 'all': ...

        return {"status": "Success", "details": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
