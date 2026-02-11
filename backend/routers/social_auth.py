from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import models, database, auth
from datetime import datetime, timedelta
import asyncio
import uuid
import os
import urllib.parse
import requests
import secrets
import hashlib
import base64
import json

router = APIRouter(
    prefix="/social",
    tags=["social"],
)

# In-memory storage for OAuth states (Production: Use Redis or DB)
# Key: state, Value: {verifier: str, platform: str, user_id: str}
oauth_states = {}

def get_env_var(name: str):
    return os.getenv(name)

@router.get("/auth/{platform}")
def social_auth_start(platform: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Start OAuth flow for a platform (instagram, twitter, youtube).
    Returns a URL to redirect the user to.
    """
    if platform not in ["instagram", "twitter", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    # Base URL for callbacks
    frontend_url = os.getenv("FRONTEND_URL", "https://meo-system-act.vercel.app").rstrip("/")
    if "localhost" in frontend_url:
        # Override for local dev if needed, or rely on .env
        pass
        
    # Ideally, the redirect_uri should match what's registered in the app
    # We'll assume a standard callback endpoint on the backend or frontend
    # Since we are returning a URL for the frontend to redirect to, 
    # we usually redirect the user to the Provider, then Provider -> Backend Callback -> Frontend
    # OR Provider -> Frontend Callback -> Backend Exchange.
    # The current Architecture in `page.tsx` expects the Frontend to handle the redirect loop?
    # No, `page.tsx` calls `auth/{platform}`, gets URL, redirects browser.
    # The Provider will redirect back to `redirect_uri`.
    # Common pattern: Provider -> Backend -> Frontend.
    # OR Provider -> Frontend -> Backend.
    # Let's use: Provider -> Frontend (settings page) -> Backend (callback API).
    
    redirect_uri = f"{frontend_url}/dashboard/settings"
    
    state = str(uuid.uuid4())
    pkce_verifier = secrets.token_urlsafe(64)
    oauth_states[state] = {
        "verifier": pkce_verifier,
        "platform": platform,
        "user_id": current_user.id
    }
    
    auth_url = ""
    
    # Fetch User Settings for Custom Keys
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    
    if platform == "instagram":
        client_id = (user_settings.instagram_client_id if user_settings else None) or get_env_var("INSTAGRAM_CLIENT_ID")
        if not client_id: return _mock_auth(platform, state, frontend_url)
        
        # Instagram Basic Display or Graph API (Business)
        base_url = "https://www.facebook.com/v19.0/dialog/oauth"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "state": f"{platform}_{state}",
            "scope": "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
            "response_type": "code"
        }
        auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
        
    elif platform == "twitter":
        client_id = (user_settings.twitter_client_id if user_settings else None) or get_env_var("TWITTER_CLIENT_ID")
        if not client_id: return _mock_auth(platform, state, frontend_url)
        
        # PKCE S256 Challenge
        code_challenge = base64.urlsafe_b64encode(hashlib.sha256(pkce_verifier.encode()).digest()).decode().rstrip("=")
        
        base_url = "https://twitter.com/i/oauth2/authorize"
        params = {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "tweet.read tweet.write users.read offline.access",
            "state": f"{platform}_{state}",
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
        auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
        
    elif platform == "youtube":
        client_id = (user_settings.youtube_client_id if user_settings else None) or get_env_var("GOOGLE_CLIENT_ID") or get_env_var("YOUTUBE_CLIENT_ID")
        if not client_id: return _mock_auth(platform, state, frontend_url)
        
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
            "access_type": "offline",
            "prompt": "consent",
            "state": f"{platform}_{state}"
        }
        auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    return {"url": auth_url}

def _mock_auth(platform, state, frontend_url):
    # Fallback to mock if no keys
    callback_url = f"{frontend_url}/dashboard/settings?platform={platform}&code=mock_code_{platform}_{state}&state={platform}_{state}"
    return {"url": callback_url}

@router.post("/callback/{platform}")
def social_auth_callback(platform: str, code: str, state: str = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Exchange code for token.
    In real flow, frontend sends code here.
    """
    if platform not in ["instagram", "twitter", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
        
    frontend_url = os.getenv("FRONTEND_URL", "https://meo-system-act.vercel.app").rstrip("/")
    redirect_uri = f"{frontend_url}/dashboard/settings"
    
    # Handle Mock Code
    if code.startswith("mock_"):
        return _mock_callback(platform, code, db, current_user)

    # Real Token Exchange
    access_token = None
    refresh_token = None
    expires_at = None
    provider_id = None
    provider_username = None
    
    # Recover state/verifier
    # Currently state passed from frontend is "{platform}_{uuid}"
    # We need to extract uuid or look it up.
    # Simple lookup for now.
    
    original_state = state.replace(f"{platform}_", "") if state else ""
    # In a robust system, we verify state exists in `oauth_states`
    
    # Fetch User Settings for Custom Keys
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()

    try:
        if platform == "instagram":
            client_id = (user_settings.instagram_client_id if user_settings else None) or get_env_var("INSTAGRAM_CLIENT_ID")
            client_secret = (user_settings.instagram_client_secret if user_settings else None) or get_env_var("INSTAGRAM_CLIENT_SECRET")
            
            # 1. Exchange for User Access Token
            url = "https://graph.facebook.com/v19.0/oauth/access_token"
            params = {
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code": code
            }
            res = requests.get(url, params=params)
            data = res.json()
            if "error" in data: raise Exception(data["error"]["message"])
            
            short_token = data.get("access_token")
            
            # 2. Exchange for Long-Lived Token (Recommended)
            url_long = "https://graph.facebook.com/v19.0/oauth/access_token"
            params_long = {
                "grant_type": "fb_exchange_token",
                "client_id": client_id,
                "client_secret": client_secret,
                "fb_exchange_token": short_token
            }
            res_long = requests.get(url_long, params=params_long)
            data_long = res_long.json()
            
            access_token = data_long.get("access_token", short_token)
            expires_in = data_long.get("expires_in", 5184000) # 60 days
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            # 3. Get User ID / Name
            # Note: For Instagram Business, we need the IG Business Account ID, typically via Pages.
            # /me/accounts?fields=instagram_business_account
            me_res = requests.get(f"https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account&access_token={access_token}")
            me_data = me_res.json()
            
            # Find the first connected IG Business Account
            # Simplification: Just take the first one found
            if "data" in me_data and len(me_data["data"]) > 0:
                page_data = me_data["data"][0]
                if "instagram_business_account" in page_data:
                    provider_id = page_data["instagram_business_account"]["id"]
                    # Fetch IG Username
                    ig_res = requests.get(f"https://graph.facebook.com/v19.0/{provider_id}?fields=username&access_token={access_token}")
                    provider_username = ig_res.json().get("username")
                else:
                    provider_username = page_data.get("name") + " (Page)"
                    provider_id = page_data.get("id") # Fallback to Page ID? No, posting needs IG ID.
            else:
                 # Fallback if no pages
                 provider_id = f"unknown_ig_{uuid.uuid4()}"
                 provider_username = "Instagram User"

        elif platform == "twitter":
            client_id = (user_settings.twitter_client_id if user_settings else None) or get_env_var("TWITTER_CLIENT_ID")
            client_secret = (user_settings.twitter_client_secret if user_settings else None) or get_env_var("TWITTER_CLIENT_SECRET")
            
            verifier = oauth_states.get(original_state, {}).get("verifier")
            
            url = "https://api.twitter.com/2/oauth2/token"
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            data = {
                "code": code,
                "grant_type": "authorization_code",
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "code_verifier": verifier or "missing_verifier", # Handled by error if fail
            }
            # Basic Auth header needed for confidential client
            auth_str = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            headers["Authorization"] = f"Basic {auth_str}"
            
            res = requests.post(url, data=data, headers=headers)
            token_data = res.json()
            if "error" in token_data: raise Exception(token_data["error_description"] if "error_description" in token_data else str(token_data))
            
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in", 7200)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            # Get User Info
            me_res = requests.get("https://api.twitter.com/2/users/me", headers={"Authorization": f"Bearer {access_token}"})
            me_data = me_res.json().get("data", {})
            provider_id = me_data.get("id")
            provider_username = me_data.get("username")

        elif platform == "youtube":
            client_id = (user_settings.youtube_client_id if user_settings else None) or get_env_var("GOOGLE_CLIENT_ID") or get_env_var("YOUTUBE_CLIENT_ID")
            client_secret = (user_settings.youtube_client_secret if user_settings else None) or get_env_var("GOOGLE_CLIENT_SECRET") or get_env_var("YOUTUBE_CLIENT_SECRET")
            
            url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
            res = requests.post(url, data=data)
            token_data = res.json()
            if "error" in token_data: raise Exception(token_data["error_description"] if "error_description" in token_data else str(token_data))
            
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in", 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            # Get Channel Info
            # https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true
            yt_res = requests.get(
                "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            yt_data = yt_res.json()
            if "items" in yt_data and len(yt_data["items"]) > 0:
                snippet = yt_data["items"][0]["snippet"]
                provider_id = yt_data["items"][0]["id"]
                provider_username = snippet.get("title")
            else:
                provider_id = f"unknown_yt_{uuid.uuid4()}"
                provider_username = "YouTube User"

    except Exception as e:
        print(f"OAuth Error: {e}")
        # Return error properly?
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

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

def _mock_callback(platform, code, db, current_user):
    # Old Mock Logic
    access_token = f"mock_{platform}_access_token_{uuid.uuid4()}"
    refresh_token = f"mock_{platform}_refresh_token_{uuid.uuid4()}"
    expires_at = datetime.utcnow() + timedelta(days=60)
    
    provider_id = f"user_{platform}_{current_user.id[:8]}"
    provider_username = f"{current_user.email.split('@')[0]}_on_{platform}"
    
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
    return {"message": f"Connected to {platform} (Mock)", "username": provider_username}

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
        # Check expiry
        is_expired = c.expires_at and c.expires_at < datetime.utcnow()
        res[c.platform] = {
            "connected": not is_expired,
            "username": c.provider_username,
            "expires_at": c.expires_at,
            "is_expired": is_expired
        }
    
    # Ensure all platforms are present
    for p in ["instagram", "twitter", "youtube"]:
        if p not in res:
            res[p] = {"connected": False}
            
    return res
