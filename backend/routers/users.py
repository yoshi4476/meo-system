from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, auth, database
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Update basic info
    if user_update.email and user_update.email != current_user.email:
        # Check uniqueness
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    
    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/settings", response_model=schemas.User)
def update_user_settings(settings: schemas.UserSettingsUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Update user-specific settings like OpenAI API Key.
    """
    user_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = models.UserSettings(user_id=current_user.id)
        db.add(user_settings)
    
    if settings.openai_api_key is not None:
        user_settings.openai_api_key = settings.openai_api_key
        
    db.commit()
    db.refresh(user_settings)
    # Return user to reflect changes if needed, or just success
    db.refresh(current_user)
    return current_user

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. Email Uniqueness Check
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Super Admin Limit Check
    if user.role == "SUPER_ADMIN":
        existing_super_admin = db.query(models.User).filter(models.User.role == "SUPER_ADMIN").first()
        if existing_super_admin:
             raise HTTPException(
                 status_code=400, 
                 detail="A Super Admin already exists. Only one is allowed per system."
             )

    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, role=user.role, hashed_password=hashed_password, is_active=True)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    print(f"DEBUG: read_users requested by {current_user.email} ({current_user.role})")
    
    if current_user.role == "SUPER_ADMIN":
        # Super Admin sees everyone
        users = db.query(models.User).offset(skip).limit(limit).all()
        return users
        
    elif current_user.role == "COMPANY_ADMIN":
        # Company Admin sees users in their company
        if not current_user.company_id:
             return [current_user] # Fallback if no company assigned
             
        users = db.query(models.User).filter(
            models.User.company_id == current_user.company_id
        ).offset(skip).limit(limit).all()
        return users
        
    else:
        # Regular user sees only themselves
        return [current_user]
