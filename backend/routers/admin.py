from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

class SystemSettingsUpdate(BaseModel):
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    openai_api_key: Optional[str] = None
    default_reply_prompt: Optional[str] = None

# In-memory settings store (in production, use DB or environment variables)
system_settings = {
    "google_client_id": "",
    "google_client_secret": "",
    "openai_api_key": "",
    "default_reply_prompt": "プロフェッショナルで親切なトーンで返信してください。"
}

@router.get("/settings")
def get_system_settings(current_user: models.User = Depends(auth.require_super_admin)):
    """
    Get system settings. Only accessible by SUPER_ADMIN.
    """
    # Mask sensitive values
    return {
        "google_client_id": system_settings["google_client_id"][:10] + "..." if system_settings["google_client_id"] else "",
        "google_client_secret": "***" if system_settings["google_client_secret"] else "",
        "openai_api_key": "sk-..." + system_settings["openai_api_key"][-4:] if system_settings["openai_api_key"] else "",
        "default_reply_prompt": system_settings["default_reply_prompt"]
    }

@router.put("/settings")
def update_system_settings(settings: SystemSettingsUpdate, current_user: models.User = Depends(auth.require_super_admin)):
    """
    Update system settings. Only accessible by SUPER_ADMIN.
    """
    if settings.google_client_id is not None:
        system_settings["google_client_id"] = settings.google_client_id
    if settings.google_client_secret is not None:
        system_settings["google_client_secret"] = settings.google_client_secret
    if settings.openai_api_key is not None:
        system_settings["openai_api_key"] = settings.openai_api_key
    if settings.default_reply_prompt is not None:
        system_settings["default_reply_prompt"] = settings.default_reply_prompt
    
    return {"message": "Settings updated successfully", "updated_fields": [k for k, v in settings.model_dump().items() if v is not None]}


class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    store_id: Optional[str] = None

class StoreCreate(BaseModel):
    name: str

@router.get("/users")
def list_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    List users. SUPER_ADMIN sees all. COMPANY_ADMIN sees company users.
    """
    if current_user.role == "SUPER_ADMIN":
        users = db.query(models.User).offset(skip).limit(limit).all()
        return users
    elif current_user.role == "COMPANY_ADMIN":
        if not current_user.company_id:
             return [current_user]
        users = db.query(models.User).filter(models.User.company_id == current_user.company_id).offset(skip).limit(limit).all()
        return users
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.post("/users")
def create_user(user: UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Create a new user.
    """
    if current_user.role not in ["SUPER_ADMIN", "COMPANY_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check email
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # RBAC logic for assignment
    company_id = user.company_id if hasattr(user, 'company_id') else None # Not in model yet, assume creation inherits or explicit
    
    if current_user.role == "COMPANY_ADMIN":
        company_id = current_user.company_id
        if user.role == "SUPER_ADMIN":
             raise HTTPException(status_code=403, detail="Cannot create Super Admin")

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email, 
        role=user.role, 
        hashed_password=hashed_password, 
        company_id=company_id,
        store_id=user.store_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/users/{user_id}/role")
def update_user_role(user_id: str, role: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Update role.
    """
    if current_user.role not in ["SUPER_ADMIN", "COMPANY_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "COMPANY_ADMIN":
        if user.company_id != current_user.company_id:
             raise HTTPException(status_code=403, detail="Cannot edit external user")
        if role == "SUPER_ADMIN":
             raise HTTPException(status_code=403, detail="Cannot promote to Super Admin")

    user.role = role
    db.commit()
    return user

@router.get("/stores")
def list_all_stores(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    List stores. SUPER_ADMIN sees all. COMPANY_ADMIN sees company stores.
    """
    if current_user.role == "SUPER_ADMIN":
        stores = db.query(models.Store).offset(skip).limit(limit).all()
        return stores
    elif current_user.role == "COMPANY_ADMIN":
         if not current_user.company_id:
            return []
         stores = db.query(models.Store).filter(models.Store.company_id == current_user.company_id).offset(skip).limit(limit).all()
         return stores
    else:
         raise HTTPException(status_code=403, detail="Not authorized")

@router.post("/stores")
def create_store(store: StoreCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Create a new store (manually).
    """
    if current_user.role not in ["SUPER_ADMIN", "COMPANY_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    company_id = None
    if current_user.role == "COMPANY_ADMIN":
        company_id = current_user.company_id
        
    new_store = models.Store(
        name=store.name,
        company_id=company_id
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    return new_store

class AutoReplySettings(BaseModel):
    enabled: bool
    prompt: Optional[str] = None
    include_past_reviews: Optional[bool] = False

@router.patch("/stores/{store_id}/auto-reply")
def update_store_auto_reply(
    store_id: str, 
    settings: AutoReplySettings, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Toggle auto-reply for a store.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Authorization check
    if current_user.role == "STORE_USER" and current_user.store_id != store_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "COMPANY_ADMIN" and store.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    store.auto_reply_enabled = settings.enabled
    
    # Handle Start Date Logic
    if settings.enabled:
        if settings.include_past_reviews:
            # Include all past reviews -> Very old date
            store.auto_reply_start_date = datetime(2000, 1, 1)
        elif store.auto_reply_start_date is None or store.auto_reply_start_date < datetime(2020, 1, 1):
            # If was previously "Include Past" (Old Date) but now not, OR first time -> Start from NOW
            store.auto_reply_start_date = datetime.utcnow()
    else:
        # If disabled, we might want to reset start_date or keep it?
        # Keeping it allows resuming? No, let's keep it simply compliant with logic.
        pass

    if settings.prompt is not None:
        store.auto_reply_prompt = settings.prompt
    
    try:
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save auto-reply settings: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Update Failed: {str(e)}")
    
    return {
        "message": f"Auto-reply {'enabled' if settings.enabled else 'disabled'} for {store.name}",
        "auto_reply_enabled": store.auto_reply_enabled,
        "auto_reply_prompt": store.auto_reply_prompt,
        "auto_reply_start_date": store.auto_reply_start_date
    }

@router.get("/stores/{store_id}/auto-reply")
def get_store_auto_reply(
    store_id: str, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get auto-reply settings for a store.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Determine if "include past" is effectively on
    # If start_date is very old (e.g. year 2000), it means we included past.
    include_past = False
    if store.auto_reply_start_date and store.auto_reply_start_date.year < 2020:
        include_past = True

    return {
        "auto_reply_enabled": store.auto_reply_enabled or False,
        "auto_reply_prompt": store.auto_reply_prompt,
        "include_past_reviews": include_past
    }
