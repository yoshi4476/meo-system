from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter(
    prefix="/google",
    tags=["google"],
    responses={404: {"description": "Not found"}},
)

@router.get("/login")
def login_google(state: str = "default"):
    """
    Generate Google OAuth URL for authentication.
    No authentication required - this is the entry point for OAuth flow.
    """
    from fastapi.responses import RedirectResponse, HTMLResponse
    try:
        auth_url = google_api.get_authorization_url(state=state)
        return RedirectResponse(url=auth_url)
    except ValueError as e:
        # Google credentials not configured - show setup instructions
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google API設定が必要です</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .card {
                    background: rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 600px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .warning { color: #fbbf24; font-size: 48px; }
                h1 { margin: 20px 0 10px; }
                p { color: #94a3b8; line-height: 1.6; }
                .steps {
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: left;
                }
                .steps ol { margin: 0; padding-left: 20px; }
                .steps li { margin: 10px 0; color: #e2e8f0; }
                code {
                    background: rgba(124, 58, 237, 0.3);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-family: monospace;
                }
                .btn {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: #7c3aed;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                }
                .btn-secondary {
                    background: transparent;
                    border: 1px solid #7c3aed;
                    margin-left: 10px;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="warning">⚠️</div>
                <h1>Google API設定が必要です</h1>
                <p>Google Business Profileと連携するには、Google Cloud ConsoleでAPIの認証情報を設定する必要があります。</p>
                
                <div class="steps">
                    <ol>
                        <li><a href="https://console.cloud.google.com/" target="_blank" style="color:#a78bfa">Google Cloud Console</a>でプロジェクトを作成</li>
                        <li>My Business Business Information APIを有効化</li>
                        <li>OAuth同意画面を設定</li>
                        <li>OAuthクライアントIDを作成</li>
                        <li><code>.env</code>ファイルに認証情報を追加:
                            <br><code>GOOGLE_CLIENT_ID=あなたのID</code>
                            <br><code>GOOGLE_CLIENT_SECRET=あなたのシークレット</code>
                        </li>
                        <li>バックエンドサーバーを再起動</li>
                    </ol>
                </div>
                
                
                <a href="http://localhost:8001/docs" class="btn">📚 詳細なセットアップガイド</a>
                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3001')}/dashboard/settings" class="btn btn-secondary">← 設定画面に戻る</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)


@router.get("/callback")
def callback_google(code: str, state: str, db: Session = Depends(database.get_db)):
    # --- LOGGING SETUP ---
    import os
    from datetime import datetime
    log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "debug_auth.log")
    
    def auth_log(msg):
        print(f"[AUTH] {msg}")
        try:
             with open(log_file, "a", encoding="utf-8") as f:
                 f.write(f"[{datetime.now()}] {msg}\n")
        except: pass
    # ---------------------

    auth_log(f"Callback received. Code: {code[:10]}... State: {state}")

    try:
        user = None
        if state != "default":
             user = db.query(models.User).filter(models.User.id == state).first()
             auth_log(f"User found from state: {user.email if user else 'None'}")
        
        # 1. Get Tokens
        auth_log("Exchanging code for tokens...")
        try:
            tokens = google_api.get_tokens(code)
            auth_log("Token exchange successful.")
        except Exception as token_err:
            auth_log(f"Token exchange FAILED: {token_err}")
            raise HTTPException(status_code=400, detail=f"Google Login Failed: {str(token_err)}")
        
        # 2. If User not known...
        if not user:
            auth_log("Fetching Google User Info (Login Flow)...")
            access_token = tokens.get("access_token")
            client = google_api.GBPClient(access_token)
            user_info = client.get_user_info()
            email = user_info.get("email")
            
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                auth_log(f"Creating new user for {email}")
                # Auto-Register
                import uuid
                random_password = uuid.uuid4().hex
                hashed_password = auth.get_password_hash(random_password)
                user = models.User(
                    email=email,
                    hashed_password=hashed_password,
                    role="STORE_USER", # Default role
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                auth_log("New user created.")

        # 3. Save Connection
        auth_log(f"Saving connection for user {user.id} ({user.email})")
        connection = user.google_connection
        if not connection:
            connection = models.GoogleConnection(user_id=user.id)
            db.add(connection)
            auth_log("New GoogleConnection object added.")
        else:
            auth_log("Updating existing GoogleConnection.")
        
        connection.access_token = tokens.get("access_token")
        connection.refresh_token = tokens.get("refresh_token")
        connection.scopes = tokens.get("scope") # Added scopes
        connection.expiry = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
        
        db.commit()
        auth_log("Connection saved successfully.")
        
        # 4. Generate App Token
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # 5. Redirect
        import os
        from fastapi.responses import RedirectResponse
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        auth_log(f"Redirecting user to {frontend_url}/dashboard")
        
        return RedirectResponse(url=f"{frontend_url}/dashboard?token={access_token}&status=success")

    except Exception as e:
        auth_log(f"Callback FATAL Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/locations")
def list_locations(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    # Check expiry and refresh if needed
    if connection.expiry and connection.expiry < datetime.utcnow():
        if not connection.refresh_token:
             raise HTTPException(status_code=400, detail="Token expired and no refresh token")
        new_tokens = google_api.refresh_access_token(connection.refresh_token)
        connection.access_token = new_tokens.get("access_token")
        connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
        db.commit()

    client = google_api.GBPClient(connection.access_token)
    try:
        accounts = client.list_accounts()
        if not accounts.get('accounts'):
             return []
        
        all_locations = []
        for account in accounts['accounts']:
            account_name = account['name']
            location_data = client.list_locations(account_name)
            if location_data and 'locations' in location_data:
                all_locations.extend(location_data['locations'])
        
        # Wrap in expected structure if needed, or just return list via pydantic
        # The frontend expects { "locations": [...] } based on page.tsx:101
        print(f"DEBUG: Found {len(all_locations)} locations across {len(accounts.get('accounts', []))} accounts via pagination.")
        return {"locations": all_locations}
    except Exception as e:
        print(f"DEBUG: Error listing locations: {e}")
        # Return empty list on error instead of 400 to avoid breaking UI? 
        # No, better to raise so we know
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sync/{location_id}")
async def sync_store_data(location_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Sync Reviews and Posts for a specific location.
    Note: location_id should be the Google Location ID or Store ID in our DB.
    """
    # 1. Verify connection
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    # 2. Refresh token if needed
    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()
    
    # 3. Perform Sync
    try:
        store = db.query(models.Store).filter(models.Store.id == location_id).first()
        if not store:
            # Try to see if location_id is actually a Google Location ID
            store = db.query(models.Store).filter(models.Store.google_location_id == location_id).first()
            
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")
            
        if not store.google_location_id:
             raise HTTPException(status_code=400, detail="Store is not linked to Google Location")

        from services.sync_service import GoogleSyncService
        client = google_api.GBPClient(connection.access_token)
        service = GoogleSyncService(client)
        
        # Sync everything
        results = await service.sync_all(db, store.id, store.google_location_id)
        
        return {"status": "success", "message": f"Successfully synced data for location {store.name}", "synced_items": results}
        
    except Exception as e:
        print(f"Error during sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class LocationSelectRequest(BaseModel):
    locationId: str
    displayName: str
    storeCode: str = None

@router.post("/locations/select")
async def select_location(
    request: LocationSelectRequest, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Select a location to manage.
    1. Creates/Updates Store record with google_location_id
    2. Links User to this Store
    """
    # DEBUG LOGGING TO FILE
    import os
    from datetime import datetime
    log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "debug.log")
    
    def log_debug(msg):
        # Print to stdout for Render/Cloud logs
        print(f"[{datetime.now()}] {msg}")
        # Also try to write to file if possible
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now()}] {msg}\n")
        except:
             pass

    log_debug(f"DEBUG: select_location called for {request.locationId}, {request.displayName}")

    # STRATEGY CHANGE: If user is already linked to a store, UPDATE that store.
    # This fixes the issue where creation fails or we have a split-brain.
    if current_user.store_id:
        log_debug(f"DEBUG: User already has store {current_user.store_id}. Updating it.")
        store = db.query(models.Store).filter(models.Store.id == current_user.store_id).first()
        if store:
            store.google_location_id = request.locationId
            store.name = request.displayName
            # Update attributes if needed? No, let sync handle that.
            try:
                db.commit()
                log_debug("DEBUG: Existing store updated with Google ID.")
                return {"status": "success", "message": f"Store linked to {request.displayName}", "store_id": store.id}
            except Exception as e:
                 log_debug(f"DEBUG: Update failed: {e}")
                 db.rollback()
                 # Fallthrough to standard logic if update fails? No, raise.
                 raise

    # Fallback to standard logic (Find by GoogleID or Create)
    store = db.query(models.Store).filter(models.Store.google_location_id == request.locationId).first()
    
    if not store:
        log_debug("DEBUG: Store not found via GoogleID, creating new one")
        store = models.Store(
            google_location_id=request.locationId,
            name=request.displayName,
            company_id=current_user.company_id # Assign to same company if exists
        )
        db.add(store)
        try:
           db.commit()
           log_debug("DEBUG: Store creation committed")
        except Exception as e:
           log_debug(f"DEBUG: Store creation commit failed: {e}")
           db.rollback()
           raise
        db.refresh(store)
    else:
        log_debug(f"DEBUG: Store found: {store.id}")
    
    # Assign user to this store
    log_debug(f"DEBUG: Assigning user {current_user.id} to store {store.id}")
    current_user.store_id = store.id
    try:
        db.add(current_user) # Ensure user is in session
        db.commit()
        log_debug("DEBUG: User assignment committed")
        
        # --- TRIGGER AUTO-SYNC ---
        # Now that we are linked, immediately fetch the details so the user sees them.
        try:
             log_debug("DEBUG: Triggering immediate auto-sync...")
             from services.sync_service import GoogleSyncService
             # We need a client. If current_user has connection, use it.
             if current_user.google_connection and current_user.google_connection.access_token:
                  client = google_api.GBPClient(current_user.google_connection.access_token)
                  service = GoogleSyncService(client)
                  # Sync Location Details (Description, Address, Hours, etc.)
                  await service.sync_location_details(db, store.id, store.google_location_id)
                  log_debug("DEBUG: Immediate auto-sync completed.")
             else:
                  log_debug("DEBUG: Skipping auto-sync (no google connection found on user object).")
        except Exception as sync_e:
             log_debug(f"DEBUG: Auto-sync failed (non-blocking): {sync_e}")
        # -------------------------

    except Exception as e:
        log_debug(f"DEBUG: User assignment commit failed: {e}")
        db.rollback()
        raise
    
    return {"status": "success", "message": f"Store {request.displayName} selected", "store_id": store.id}
