import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import models
from services import google_api

def list_locations():
    db = database.SessionLocal()
    try:
        email = "y.wakata.linkdesign@gmail.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            print(f"User {email} not found in DB.")
            return

        if not user.google_connection:
            print("User has no Google connection.")
            return

        print(f"--- Fetching Locations for {email} ---")
        client = google_api.GBPClient(user.google_connection.access_token)
        
        # List Accounts first
        accounts = client.list_accounts()
        if not accounts.get('accounts'):
            print("No accounts found.")
            return

        for acc in accounts['accounts']:
            print(f"\nAccount: {acc['name']} ({acc.get('accountName')})")
            locs = client.list_locations(acc['name'])
            
            if not locs.get('locations'):
                print("  No locations found in this account.")
                continue

            for loc in locs['locations']:
                print(f"  - NAME: {loc.get('title')}")
                print(f"    ID: {loc.get('name')}") # "locations/..."
                print(f"    Address: {loc.get('storeCode', 'No Store Code')}")
                print("    ---")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_locations()
