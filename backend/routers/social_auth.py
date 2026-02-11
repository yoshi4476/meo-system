from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import models, database, auth
from datetime import datetime, timedelta
import asyncio
import uuid

router = APIRouter(
    prefix="/social",
    tags=["social"],
)

# --- MOCK AUTH URLS and CALLBACKS (Since we don't have real Client IDs yet) ---
# In production, these would be real OAuth 2.0 flows.

@router.get("/auth/{platform}")
def social_auth_start(platform: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Start OAuth flow for a platform (instagram, twitter, youtube).
    Returns a URL to redirect the user to.
    """
    if platform not in ["instagram", "twitter", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
        
    # Generate state to prevent CSRF
    state = str(uuid.uuid4())
    
    # Check if user has specific Client ID configured? 
    # For now, we assume System Default or User-Provided in settings (not implemented yet).
    # We will simulate a successful redirect.
    
    # Ideally: Return https://api.instagram.com/oauth/authorize?client_id=...
    
    # SIMULATION: Redirect to our own callback with a fake code
    import os
    frontend_url = os.getenv("FRONTEND_URL", "https://meo-system-act.vercel.app").rstrip("/")
    if "localhost" in frontend_url:
        frontend_url = "http://localhost:3000" # Local dev override if needed, but env var is better

    callback_url = f"{frontend_url}/dashboard/settings?platform={platform}&code=mock_code_{platform}_{state}&state={state}"
    
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=callback_url)

@router.post("/callback/{platform}")
def social_auth_callback(platform: str, code: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Exchange code for token.
    In real flow, frontend sends code here.
    """
    if platform not in ["instagram", "twitter", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    # VERIFY CODE (Mock)
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
        
    # MOCK TOKEN EXCHANGE
    access_token = f"mock_{platform}_access_token_{uuid.uuid4()}"
    refresh_token = f"mock_{platform}_refresh_token_{uuid.uuid4()}"
    expires_at = datetime.utcnow() + timedelta(days=60)
    
    provider_id = f"user_{platform}_{current_user.id[:8]}"
    provider_username = f"{current_user.email.split('@')[0]}_on_{platform}"
    
    # UPSERT CONNECTION
    existing = db.query(models.SocialConnection).filter(
        models.SocialConnection.user_id == current_user.id,
        models.SocialConnection.platform == platform
    ).first()
    
    if existing:
        existing.access_token = access_token
        existing.refresh_token = refresh_token
        existing.expires_at = expires_at
        existing.provider_account_id = provider_id
        existing.provider_username = provider_username
    else:
        new_conn = models.SocialConnection(
            user_id=current_user.id,
            platform=platform,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            provider_account_id=provider_id,
            provider_username=provider_username
        )
        db.add(new_conn)
    
    db.commit()
    
    return {"message": f"Connected to {platform}", "username": provider_username}

@router.delete("/disconnect/{platform}")
def disconnect_social(platform: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Disconnect a social platform.
    """
    conn = db.query(models.SocialConnection).filter(
        models.SocialConnection.user_id == current_user.id,
        models.SocialConnection.platform == platform
    ).first()
    
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    db.delete(conn)
    db.commit()
    
    return {"message": f"Disconnected from {platform}"}

@router.get("/status")
def get_social_status(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get connection status for all platforms.
    """
    connections = db.query(models.SocialConnection).filter(
        models.SocialConnection.user_id == current_user.id
    ).all()
    
    res = {}
    for c in connections:
        res[c.platform] = {
            "connected": True,
            "username": c.provider_username,
            "expires_at": c.expires_at
        }
    
    # Ensure all platforms are present
    for p in ["instagram", "twitter", "youtube"]:
        if p not in res:
            res[p] = {"connected": False}
            
    return res
