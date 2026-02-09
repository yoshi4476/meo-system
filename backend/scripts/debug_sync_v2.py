
import os
import sys
import asyncio
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import SessionLocal
from models import User, Store, Post
from services import google_api

def debug_sync():
    db = SessionLocal()
    try:
        from models import GoogleConnection
        
        # 0. Audit Users
        print("\n--- AUDIT: Use/Connection Status ---")
        users = db.query(User).all()
        for u in users:
            conn_status = "[CONNECTED]" if u.google_connection else "[DISCONNECTED]"
            print(f"User: {u.email} | Role: {u.role} | Status: {conn_status}")
            
        print(f"\n--- AUDIT: Raw Connection Table ---")
        conns = db.query(GoogleConnection).all()
        print(f"Total GoogleConnection rows: {len(conns)}")
        for c in conns:
            print(f" - ID: {c.id} | UserID: {c.user_id} | Expiry: {c.expiry}")
            
        # 1. Get User and Store
        user = db.query(User).filter(User.email == "nyan.test.user@gmail.com").first() # Adjust if needed
        if not user:
            print("ERROR: User not found")
            users = db.query(User).all()
            if users:
                user = users[0]
                print(f"Fallback to user: {user.email}")
            else:
                return

        store = db.query(Store).filter(Store.id == user.store_id).first()
        if not store:
            print("ERROR: Store not found for user")
            # Fallback
            store = db.query(Store).first()
            if store:
                print(f"Fallback to store: {store.name} ({store.id})")
            else:
                return

        print(f"DEBUG: Testing with User: {user.email}, Store: {store.name}")
        print(f"DEBUG: Google Connection Exists? {bool(user.google_connection)}")
        
        if not user.google_connection:
            print("CRTICAL: No Google Connection. Sync impossible.")
            return

        client = google_api.GBPClient(user.google_connection.access_token)

        # 2. Test Store Update (Description)
        print("\n--- TEST 1: Store Update ---")
        try:
            # Append timestamp to description to force change
            current_desc = store.description or ""
            new_desc = f"{current_desc.split(' [Test]')[0]} [Test] {datetime.now().strftime('%H:%M:%S')}"
            
            update_data = {"profile": {"description": new_desc}}
            update_mask = "profile"
            
            print(f"Attempting to update description to: {new_desc}")
            result = client.update_location(store.google_location_id, update_data, update_mask)
            print("Update Success!")
            print(result)
        except Exception as e:
            print(f"Update Failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")

        # 3. Test Post Deletion Logic (Inspect IDs)
        print("\n--- TEST 2: Inspect Post IDs ---")
        posts = db.query(Post).filter(Post.store_id == store.id).all()
        print(f"Found {len(posts)} local posts.")
        for p in posts:
            print(f" - Local ID: {p.id}")
            print(f" - Google ID: {p.google_post_id}")
            print(f" - Status: {p.status}")
        
        print("\nFetching Google Posts...")
        try:
            g_posts = client.list_local_posts(store.google_location_id)
            for gp in g_posts.get("localPosts", []):
                print(f" - Google Post Name (ID): {gp.get('name')}")
                print(f" - Summary: {gp.get('summary')}")
        except Exception as e:
            print(f"Fetch Posts Failed: {e}")

        # 4. Create and Delete Test Post
        print("\n--- TEST 3: Create & Delete Lifecycle ---")
        try:
            # Create
            post_data = {
                "summary": f"Debug Post {datetime.now().isoformat()}",
                "topicType": "STANDARD"
            }
            create_res = client.create_local_post(store.google_location_id, post_data)
            created_name = create_res.get("name")
            print(f"Created Test Post: {created_name}")
            
            # Delete
            print(f"Deleting Test Post: {created_name}")
            client.delete_local_post(created_name, location_name=store.google_location_id)
            print("Delete Success!")
            
        except Exception as e:
            print(f"Lifecycle Test Failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")

    finally:
        db.close()

if __name__ == "__main__":
    debug_sync()
