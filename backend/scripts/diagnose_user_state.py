import sys
import os
import json
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import database
import models

def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError ("Type not serializable")

def diagnose_user_state():
    db = database.SessionLocal()
    try:
        user_email = "7senses.gran.toukou@gmail.com"
        user = db.query(models.User).filter(models.User.email == user_email).first()
        
        print(f"=== USER DIAGNOSIS: {user_email} ===")
        if not user:
            print("User NOT FOUND")
            return

        print(f"User ID: {user.id}")
        print(f"Role: {user.role}")
        print(f"Company ID: {user.company_id}")
        
        # Connection
        conn = user.google_connection
        if conn:
            print(f"Google Connection: EXISTS (ID: {conn.id})")
            print(f"  Expiry: {conn.expiry}")
            print(f"  Scopes: {conn.scopes}")
            print(f"  Access Token (First 10): {conn.access_token[:10] if conn.access_token else 'None'}")
        else:
            print("Google Connection: NONE")

        # Stores
        print("\n=== STORES ===")
        stores = db.query(models.Store).all()
        print(f"Total Stores in DB: {len(stores)}")
        
        for s in stores:
            print(f"\n--- Store: {s.name} ({s.id}) ---")
            print(f"  Company ID: {s.company_id}")
            print(f"  Google Location ID: {s.google_location_id}")
            print(f"  Address (Column): {s.address}")
            print(f"  Regular Hours (Column): {s.regular_hours}")
            
            # Check for specific address fields
            print(f"  Address Line 2: {s.address_line2}")
            print(f"  City: {s.city}")
            print(f"  Prefecture: {s.prefecture}")
            
            if s.gbp_data:
                print(f"  GBP Data (Address): {json.dumps(s.gbp_data.get('postalAddress'), ensure_ascii=False)}")
                print(f"  GBP Data (Hours): {json.dumps(s.gbp_data.get('regularHours'), ensure_ascii=False)}")
            else:
                print("  GBP Data: NONE")
                
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_user_state()
