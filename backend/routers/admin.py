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

@router.get("/users")
def list_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.require_super_admin)):
    """
    List all users. Only accessible by SUPER_ADMIN.
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.patch("/users/{user_id}/role")
def update_user_role(user_id: str, role: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.require_super_admin)):
    """
    Update a user's role. Only accessible by SUPER_ADMIN.
    """
    if role not in ["SUPER_ADMIN", "COMPANY_ADMIN", "STORE_USER"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    db.commit()
    return {"message": f"User role updated to {role}"}
