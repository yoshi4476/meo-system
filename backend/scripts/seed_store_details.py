
import sys
import os
import json
from datetime import datetime, timezone

# Add parent directory to path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import engine, SessionLocal
import models

def seed_store_details():
    db = SessionLocal()
    try:
        # Data provided by user
        store_data = {
            "name": "locations/123456789", # Fake Google Location Name
            "title": "すなっく きゃさりん",
            "categories": {
                "primaryCategory": {
                    "displayName": "バー",
                    "categoryId": "gcid:bar"
                }
            },
            "phoneNumbers": {
                "primaryPhone": "090-7478-8294"
            },
            "websiteUri": "https://www.instagram.com/sunatsukukiyasarin?igsh=MWVmNWw2NGlsaGE1aw==",
            # Postal Address Object (Google V1 format)
            "postalAddress": {
                "regionCode": "JP",
                "postalCode": "537-0003",
                "administrativeArea": "大阪府",
                "locality": "大阪市東成区神路", # Just guessing split, user provided "大阪市東成区神路1-5-12"
                "addressLines": [
                    "1-5-12",
                    "ギャラクシー深江橋ビル3F3A"
                ] 
            },
            "profile": {
                "description": "2025年6月1日開業。\nカラオケバー・ラウンジ。"
            },
            "openInfo": {
                "status": "OPEN",
                "openingDate": {
                    "year": 2025,
                    "month": 6,
                    "day": 1
                }
            },
            # Hours: Sun-Sat 20:00-3:00 (Next day)
            "regularHours": {
                "periods": [
                    {"openDay": "SUNDAY", "openTime": "20:00", "closeDay": "MONDAY", "closeTime": "03:00"},
                    {"openDay": "MONDAY", "openTime": "20:00", "closeDay": "TUESDAY", "closeTime": "03:00"},
                    {"openDay": "TUESDAY", "openTime": "20:00", "closeDay": "WEDNESDAY", "closeTime": "03:00"},
                    {"openDay": "WEDNESDAY", "openTime": "20:00", "closeDay": "THURSDAY", "closeTime": "03:00"},
                    {"openDay": "THURSDAY", "openTime": "20:00", "closeDay": "FRIDAY", "closeTime": "03:00"},
                    {"openDay": "FRIDAY", "openTime": "20:00", "closeDay": "SATURDAY", "closeTime": "03:00"},
                    {"openDay": "SATURDAY", "openTime": "20:00", "closeDay": "SUNDAY", "closeTime": "03:00"},
                ]
            },
            # Attributes provided by user (Simulating enriched format)
            "attributes": [
                {"displayName": "アルコール飲料あり", "valueType": "BOOL", "values": [True], "attributeId": "has_alcohol"},
                {"displayName": "ゲーム機なし", "valueType": "BOOL", "values": [False], "attributeId": "no_games"},
                {"displayName": "ビールあり", "valueType": "BOOL", "values": [True], "attributeId": "has_beer"},
                {"displayName": "食べ物の提供あり", "valueType": "BOOL", "values": [True], "attributeId": "serves_food"},
                {"displayName": "踊れる雰囲気", "valueType": "BOOL", "values": [True], "attributeId": "dancing"},
                {"displayName": "お持ち帰り: 非対応", "valueType": "BOOL", "values": [False], "attributeId": "no_takeout"},
                {"displayName": "予約可", "valueType": "BOOL", "values": [True], "attributeId": "reservations"},
                {"displayName": "クレジットカード払い可", "valueType": "BOOL", "values": [True], "attributeId": "credit_cards"},
                {"displayName": "トイレあり", "valueType": "BOOL", "values": [True], "attributeId": "restroom"},
                # Add others as needed...
            ]
        }
        
        # Find the store
        store = db.query(models.Store).first()
        
        if not store:
            print("No store found. Creating one...")
            store = models.Store(id="b0225d69-f360-4013-9493-a7b50b9f122b")
            db.add(store)
            
        print(f"Updating store: {store.id}")
        
        # IMPORTANT: Update gbp_data column!
        store.gbp_data = store_data
        
        # Also update individual columns for query purposes
        store.name = store_data["title"]
        store.phone_number = store_data["phoneNumbers"]["primaryPhone"]
        store.website_url = store_data["websiteUri"]
        store.categories = store_data["categories"]
        store.address = json.dumps(store_data["postalAddress"], ensure_ascii=False) # Store address as JSON string or object? Models says String but might be used as JSON.
        # Check models.py: address = Column(String)
        # But wait, frontend profile might use gbp_data["postalAddress"] mostly.
        
        store.regular_hours = store_data["regularHours"]
        store.attributes = store_data["attributes"]
        store.last_synced_at = datetime.now(timezone.utc)
        
        db.commit()
        print("Store updated successfully with FULL gbp_data.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_store_details()
