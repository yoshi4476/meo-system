
import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import engine, SessionLocal
import models

def fix_user_link():
    db = SessionLocal()
    try:
        # 1. Find the store we seeded
        store = db.query(models.Store).filter(models.Store.id == "b0225d69-f360-4013-9493-a7b50b9f122b").first()
        if not store:
            print("Seeded store not found! Running seed script first...")
            # Fallback: Just pick any store
            store = db.query(models.Store).first()
        
        if not store:
            print("CRITICAL: No stores in database.")
            return

        print(f"Target Store: {store.name} ({store.id})")

        # 2. Find the user
        # Just pick the first user
        user = db.query(models.User).first()
        if not user:
            print("CRITICAL: No users in database.")
            return

        print(f"Target User: {user.email} (Current Store ID: {user.store_id})")

        # 3. Link them
        if user.store_id != store.id:
            print(f"Linking user {user.email} to store {store.name}...")
            user.store_id = store.id
            db.commit()
            print("Link successful!")
        else:
            print("User is already linked to this store.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_link()
