import sys
import os
import requests
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.google_api import GBPClient
from database import SessionLocal
import models

def diagnose():
    db = SessionLocal()
    try:
        # Get first user with Google Connection
        user = db.query(models.User).filter(models.User.google_connection != None).first()
        if not user:
            print("No user with Google Connection found.")
            return

        print(f"Using user: {user.email}")
        connection = user.google_connection
        token = connection.access_token # Assumption: verified/refreshed elsewhere or manually
        
        client = GBPClient(token)
        
        # 1. List Locations (to get a valid location ID)
        print("\n--- Listing Locations ---")
        # Try listing with a broader mask
        # Default mask in code: "name,title,storeCode,latlng,phoneNumbers,categories,metadata,profile,serviceArea"
        # Let's try adding postalAddress
        base_url = "https://mybusinessbusinessinformation.googleapis.com/v1"
        accounts = client.list_accounts()
        if not accounts.get("accounts"):
            print("No accounts.")
            return

        account_name = accounts["accounts"][0]["name"]
        print(f"Account: {account_name}")
        
        # Test 1: list_locations with postalAddress
        print("\n[Test 1] list_locations with postalAddress")
        url = f"{base_url}/{account_name}/locations"
        params = {"readMask": "name,title,storeCode,postalAddress"} 
        res = requests.get(url, headers=client._get_headers(), params=params)
        print(f"Status: {res.status_code}")
        if res.ok:
            data = res.json()
            if data.get("locations"):
                loc = data["locations"][0]
                print(f"Success! Found address: {loc.get('postalAddress')}")
                target_location_name = loc["name"]
            else:
                print("Success but no locations found.")
                return
        else:
            print(f"Failed: {res.text}")
            # Get a target location from standard list if failed
            std_res = client.list_locations(account_name)
            if std_res.get("locations"):
                target_location_name = std_res["locations"][0]["name"]
            else:
                print("Could not find any location to test details on.")
                return

        print(f"\nTarget Location: {target_location_name}")

        # Test 2: get_location_details with postalAddress
        print("\n[Test 2] get_location_details with postalAddress")
        url = f"{base_url}/{target_location_name}"
        params = {"readMask": "postalAddress"}
        res = requests.get(url, headers=client._get_headers(), params=params)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:200]}")

        # Test 3: get_location_details with attributes
        print("\n[Test 3] get_location_details with attributes")
        params = {"readMask": "attributes"}
        res = requests.get(url, headers=client._get_headers(), params=params)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:200]}")

        # Test 4: get_location_details with serviceArea (maybe it hides address?)
        print("\n[Test 4] get_location_details with serviceArea")
        params = {"readMask": "serviceArea"}
        res = requests.get(url, headers=client._get_headers(), params=params)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:200]}")
        
        # Test 5: v4 API for Attributes? (Some attributes are v4 only?)
        # v4 location ID
        # target_location_name is "locations/..."
        # v4 needs "accounts/.../locations/..."
        # But we can try the helper
        try:
             v4_name = client._get_v4_location_path(target_location_name)
             print(f"\n[Test 5] v4 get_location for attributes: {v4_name}")
             url_v4 = f"https://mybusiness.googleapis.com/v4/{v4_name}"
             res = requests.get(url_v4, headers=client._get_headers())
             print(f"Status: {res.status_code}")
             if res.ok:
                 data = res.json()
                 print(f"Attributes present? {'attributes' in data}")
                 # print(data) 
             else:
                 print(f"Error: {res.text}")
        except Exception as e:
            print(f"v4 conversion failed: {e}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    diagnose()
