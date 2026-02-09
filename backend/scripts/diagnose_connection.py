import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models import User, Store
from services.google_api import GBPClient
import database 
from dotenv import load_dotenv

# Re-configure database module to find the db file correctly relative to execution if needed
# But database.py uses ./sql_app.db so running from root should work.

load_dotenv()
print(f"Using Database: {database.engine.url}")
start_db = database.SessionLocal()


def diagnose():
    db = start_db
    try:
        # 1. Get the first user (assuming single user for now or developer testing)
        user = db.query(User).first()
        if not user:
            print("ERROR: No user found in DB.")
            return
        
        print(f"User: {user.email}")
        
        if not user.google_connection:
            print("ERROR: User has no Google Connection.")
            return
            
        print("Google Connection Found.")
        print(f"Token (first 10 chars): {user.google_connection.access_token[:10]}...")
        
        client = GBPClient(user.google_connection.access_token)
        
        # 2. List Accounts
        print("\n--- Listing Accounts ---")
        try:
            accounts = client.list_accounts()
            if not accounts.get("accounts"):
                 print("WARNING: No accounts returned.")
            
            for acc in accounts.get("accounts", []):
                print(f"Account: {acc['name']} ({acc.get('accountName')})")
                
                # 3. List Locations
                print(f"  --- Listing Locations for {acc['name']} ---")
                try:
                    locs = client.list_locations(acc['name'])
                    if not locs.get("locations"):
                        print("    WARNING: No locations found in this account.")
                    
                    for loc in locs.get("locations", []):
                        print(f"    Location: {loc.get('title')} ({loc['name']})")
                        print(f"      - Address: {loc.get('postalAddress')}")
                        print(f"      - Phone: {loc.get('phoneNumbers')}")
                except Exception as e:
                    print(f"    ERROR Listing Locations: {e}")

        except Exception as e:
            print(f"ERROR Listing Accounts: {e}")
            
    finally:
        db.close()

if __name__ == "__main__":
    diagnose()
