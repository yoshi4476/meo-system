import sys
import os

# Add backend directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models, auth

def set_super_admin(email: str):
    db: Session = SessionLocal()
    try:
        # 1. Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if user:
            print(f"User {email} found. Updating role to SUPER_ADMIN.")
            user.role = "SUPER_ADMIN"
            user.is_active = True
        else:
            print(f"User {email} not found. Creating new SUPER_ADMIN.")
            # Create new user with default password 'password123' (User should change this!)
            hashed_password = auth.get_password_hash("password123")
            user = models.User(
                email=email,
                hashed_password=hashed_password,
                role="SUPER_ADMIN",
                is_active=True
            )
            db.add(user)
        
        # 2. Demote OTHER Super Admins to COMPANY_ADMIN (or similar) to enforce "Only 1"
        other_admins = db.query(models.User).filter(
            models.User.role == "SUPER_ADMIN",
            models.User.email != email
        ).all()
        
        for admin in other_admins:
            print(f"Demoting previous Super Admin: {admin.email} -> COMPANY_ADMIN")
            admin.role = "COMPANY_ADMIN"
        
        db.commit()
        print("SUCCESS: Super Admin set to", email)
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_email = sys.argv[1]
    else:
        target_email = "7senses.gran.toukou@gmail.com"
    
    set_super_admin(target_email)
