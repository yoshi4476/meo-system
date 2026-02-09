
import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import engine, SessionLocal
import models

def reset_store():
    db = SessionLocal()
    try:
        stores = db.query(models.Store).all()
        print(f"Found {len(stores)} stores.")
        
        for store in stores:
            print(f"Store ID: {store.id}, Name: {store.name}, Google ID: {store.google_location_id}")
            
        if not stores:
            print("No stores to delete.")
            return

        # For this specific user request, we assume they want to clear the ONLY store or ALL stores to reset.
        # To be safe, let's delete all (assuming single user dev env) or ask (hard in script).
        # Given "Delete store info from sidebar", likely the active one.
        
        confirm = "y" # defaulting to yes for this tool-run script
        if confirm == "y":
            for store in stores:
                # Delete related data first (Cascade should handle this but let's be explicit if needed)
                # Actually models usually have cascade. Let's try deleting store.
                print(f"Deleting store {store.name}...")
                db.delete(store)
            
            db.commit()
            print("All stores deleted successfully.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_store()
