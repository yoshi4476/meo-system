
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import SessionLocal
import models

def check_connection():
    db = SessionLocal()
    try:
        user = db.query(models.User).first()
        if not user:
            print("No user found.")
            return

        print(f"User: {user.email}")
        print(f"Store ID: {user.store_id}")
        
        # Check connection
        conn = db.query(models.GoogleConnection).filter(models.GoogleConnection.user_id == user.id).first()
        if conn:
            print("Google Connection: FOUND")
            print(f"  - Account ID: {conn.google_account_id}")
            print(f"  - Token valid? {bool(conn.access_token)}")
        else:
            print("Google Connection: MISSING (This is the cause)")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_connection()
