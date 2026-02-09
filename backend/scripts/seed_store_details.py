
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
        # User provided:
        # Business Name: すなっく きゃさりん
        # Category: バー (Main), ラウンジ, 軽食店, カラオケ バー, カラオケ
        # Open Date: 2025-06-01
        # Phone: 090-7478-8294
        # Website: https://www.instagram.com/sunatsukukiyasarin?igsh=MWVmNWw2NGlsaGE1aw==
        # Profile: https://www.instagram.com/sunatsukukiyasarin/
        # Address: 〒5370003 大阪府 大阪市東成区神路1-5-12 ギャラクシー深江橋ビル3F3A
        # Hours: Sun-Sat 20:00-3:00
        # Attributes: (Many)

        store_data = {
            "name": "すなっく きゃさりん",
            "category": "バー", # Main
            "phone_number": "090-7478-8294",
            "website_url": "https://www.instagram.com/sunatsukukiyasarin?igsh=MWVmNWw2NGlsaGE1aw==",
            "zip_code": "537-0003",
            "prefecture": "大阪府",
            "city": "大阪市東成区神路1-5-12",
            "address_line2": "ギャラクシー深江橋ビル3F3A",
            "address": "〒537-0003 大阪府 大阪市東成区神路1-5-12 ギャラクシー深江橋ビル3F3A",
            "description": "2025年6月1日開業。\nカラオケバー・ラウンジ。", 
            
            # Hours: Sun-Sat 20:00-3:00 (Next day)
            "regular_hours": {
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
            # Attributes provided by user
            "attributes": [
                {"displayName": "アルコール飲料あり", "value": True, "id": "has_alcohol"},
                {"displayName": "ゲーム機なし", "value": False, "id": "no_games"},
                {"displayName": "食べ物のハッピーアワーなし", "value": False, "id": "no_food_happy_hour"},
                {"displayName": "ビールあり", "value": True, "id": "has_beer"},
                {"displayName": "食べ物の提供あり", "value": True, "id": "serves_food"},
                {"displayName": "踊れる雰囲気", "value": True, "id": "dancing"},
                {"displayName": "個室なし", "value": False, "id": "no_private_room"},
                {"displayName": "非接触宅配非対応", "value": False, "id": "no_contactless_delivery"},
                {"displayName": "宅配非対応", "value": False, "id": "no_delivery"},
                {"displayName": "ドライブスルーなし", "value": False, "id": "no_drive_through"},
                {"displayName": "テイクアウト非対応", "value": False, "id": "no_takeout"},
                {"displayName": "イートイン利用可", "value": True, "id": "dine_in"},
                {"displayName": "入り口は車椅子非対応", "value": False, "id": "wheelchair_entrance_fail"},
                {"displayName": "車椅子対応の駐車場なし", "value": False, "id": "wheelchair_parking_fail"},
                {"displayName": "予約可", "value": True, "id": "reservations"},
                {"displayName": "犬の同伴不可", "value": False, "id": "no_dogs"},
                {"displayName": "子ども向きではない", "value": True, "id": "not_for_kids"},
                {"displayName": "クレジットカード払い可", "value": True, "id": "credit_cards"},
                {"displayName": "現金以外も対応可", "value": True, "id": "cashless"},
                {"displayName": "PayPay で支払い可", "value": True, "id": "paypay"},
                {"displayName": "ライブ音楽なし", "value": False, "id": "no_live_music"},
                {"displayName": "スポーツ観戦向きではない", "value": False, "id": "no_sports"},
                {"displayName": "屋上の席なし", "value": False, "id": "no_rooftop"},
                {"displayName": "トイレあり", "value": True, "id": "restroom"},
                {"displayName": "テーブル サービスあり", "value": True, "id": "table_service"},
            ]
        }
        
        # Find the store (assuming only one or create new)
        store = db.query(models.Store).first()
        
        if not store:
            print("No store found. Creating one...")
            store = models.Store(id="b0225d69-f360-4013-9493-a7b50b9f122b") # Reuse ID if known or random
            db.add(store)
            
        print(f"Updating store: {store.id}")
        
        # Update fields
        store.name = store_data["name"]
        store.category = store_data["category"]
        store.phone_number = store_data["phone_number"]
        store.website_url = store_data["website_url"]
        store.zip_code = store_data["zip_code"]
        store.prefecture = store_data["prefecture"]
        store.city = store_data["city"]
        store.address_line2 = store_data["address_line2"]
        store.address = store_data["address"]
        store.regular_hours = store_data["regular_hours"]
        store.attributes = store_data["attributes"]
        store.description = store_data["description"]
        
        # Ensure last_synced_at is set so it shows as "synced"
        store.last_synced_at = datetime.now(timezone.utc)
        
        db.commit()
        print("Store updated successfully with FULL user data.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_store_details()
