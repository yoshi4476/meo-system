
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Store

# Define paths to check
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
DB_PATHS = [
    os.path.join(BACKEND_DIR, "sql_app.db"),
    os.path.join(ROOT_DIR, "sql_app.db")
]

def reset_store_details():
    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            print(f"Skipping {db_path} (Not found)")
            continue
            
        print(f"Processing DB: {db_path}")
        # Create engine for this specific path
        engine = create_engine(f"sqlite:///{db_path}")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            stores = db.query(Store).all()
            if not stores:
                print("  No stores found.")
                continue

            for store in stores:
                print(f"  Clearing details for store: {store.name} ({store.id})")
                # Set detailed fields to None
                store.phone_number = None
                store.website_url = None
                store.zip_code = None
                store.prefecture = None
                store.city = None
                store.address_line2 = None
                store.regular_hours = None
                store.attributes = None
                store.last_synced_at = None 
                
                # Also reset gbp_data to force full refresh if needed?
                # store.gbp_data = None 
            
            db.commit()
            print(f"  Successfully reset details for {len(stores)} stores.")
            
        except Exception as e:
            print(f"  Error processing {db_path}: {e}")
            db.rollback()
        finally:
            db.close()
            
    print("\nAll Done. Please click 'Sync from Google' in the dashboard to re-fetch fresh data.")

if __name__ == "__main__":
    reset_store_details()

