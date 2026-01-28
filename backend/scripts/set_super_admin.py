import sys
import os

# Add the parent directory to sys.path so we can import from the backend module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend import models, database # Adjust import based on where this script is run
import argparse

# Usage: python scripts/set_super_admin.py --email user@example.com

def set_super_admin(email):
    # Setup DB connection
    # Note: Ensure DATABASE_URL is set in environment, or use default from database.py
    # We will try to pull from the same logic as database.py if possible, 
    # but for a script it's often safer to re-create the engine logic or import it.
    
    db = database.SessionLocal()
    
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"Error: User with email {email} not found.")
            return

        print(f"Found user: {user.email} (Current Role: {user.role})")
        
        # Check if another super admin exists (optional check, but good for safety)
        existing_super = db.query(models.User).filter(models.User.role == "SUPER_ADMIN").first()
        if existing_super and existing_super.id != user.id:
            print(f"Warning: Another Super Admin already exists: {existing_super.email}")
            confirm = input("Do you want to overwrite/add another Super Admin? (y/n): ")
            if confirm.lower() != 'y':
                print("Operation cancelled.")
                return

        user.role = "SUPER_ADMIN"
        db.commit()
        print(f"Success! User {email} has been promoted to SUPER_ADMIN.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a user to Super Admin")
    parser.add_argument("--email", required=True, help="Email of the user to promote")
    args = parser.parse_args()
    
    set_super_admin(args.email)
