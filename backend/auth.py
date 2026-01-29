from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import os
import models, database
from sqlalchemy.orm import Session

# Secret key settings
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440)) # Default 24 hours

# Use argon2 instead of bcrypt (no 72-byte password limit)
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="token",
    description="JWT Bearer Token認証 - /tokenエンドポイントでトークンを取得してください"
)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # bcrypt has a 72-byte limit; truncate by UTF-8 bytes, not characters
    password_bytes = password.encode('utf-8')[:72]
    truncated_password = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(truncated_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Auth Error: Validation Failed (Generic)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # DEBUG LOGGING
        print(f"DEBUG AUTH: Verifying token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        print(f"DEBUG AUTH: Payload sub (email): {email}")
        
        if email is None:
            print("DEBUG AUTH: Email is None")
            raise HTTPException(
                status_code=401,
                detail="Auth Error: Token missing email (sub)",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError as e:
        print(f"DEBUG AUTH: JWTError: {e}")
        raise HTTPException(
            status_code=401,
            detail=f"Auth Error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    from sqlalchemy.orm import joinedload
    user = db.query(models.User).options(
        joinedload(models.User.google_connection),
        joinedload(models.User.store)
    ).filter(models.User.email == email).first()
    
    if user is None:
        print(f"DEBUG AUTH: User not found for email {email}")
        raise HTTPException(
            status_code=401,
            detail=f"Auth Error: User not found for {email}",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return user

def require_super_admin(current_user: models.User = Depends(get_current_user)):
    """
    Dependency to ensure the current user is a SUPER_ADMIN.
    Use this for routes that should only be accessible to super admins.
    """
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Not authorized. Super Admin access required."
        )
    return current_user

def require_company_admin(current_user: models.User = Depends(get_current_user)):
    """
    Dependency to ensure user is SUPER_ADMIN or COMPANY_ADMIN.
    """
    if current_user.role not in ["SUPER_ADMIN", "COMPANY_ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized. Company Admin access required."
        )
    return current_user

def require_store_access(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """
    Dependency to ensure user has access to the specific store.
    - SUPER_ADMIN: Access all
    - COMPANY_ADMIN: Access if store belongs to their company
    - STORE_USER: Access if assigned to this store
    """
    if current_user.role == "SUPER_ADMIN":
        return current_user
        
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found in database")

    if current_user.role == "COMPANY_ADMIN":
        if current_user.company_id != store.company_id:
            raise HTTPException(status_code=403, detail="Not authorized for this company's store")
            
    if current_user.role == "STORE_USER":
        if current_user.store_id != store_id:
             raise HTTPException(status_code=403, detail="Not authorized for this store")
             
    return current_user
