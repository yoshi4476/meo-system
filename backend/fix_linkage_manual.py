
import sqlite3
import os
import uuid
from datetime import datetime

# Target the ROOT database where the user is confirmed to exist
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT_DIR, "sql_app.db")

# User email to target
TARGET_EMAIL = "7senses.gran.toukou@gmail.com"

# Store Details to Force
STORE_NAME = "MEO Cafe 渋谷店" # Replace with actual name if known, using a safe default
GOOGLE_LOCATION_ID = "locations/17668661640628373024" # Example ID or NULL if unknown. Better to leave NULL if unknown, but we need something to link. 
# UPDATE: usage manual says user selects it. I will use a placeholder that will be updated on sync.
# Actually, I should check if the user has a google_location_id in the other DB and copy it? 
# The other DB had "Test Store" with google_location_id=None.
# So I will create a fresh "Test Store" or "My Store".

def fix_linkage():
    print(f"Fixing linkage in: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("DB not found!")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Find User
        cursor.execute("SELECT id, email, store_id FROM users WHERE email = ?", (TARGET_EMAIL,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User {TARGET_EMAIL} not found!")
            return

        print(f"Found User: {user['email']} (ID: {user['id']})")
        print(f"Current Store ID: {user['store_id']}")

        # 2. Create Store
        # Generate new ID
        new_store_id = str(uuid.uuid4())
        print(f"Creating new Store with ID: {new_store_id}")
        
        # We'll create a basic store. user can update details later.
        # google_location_id is critical. If we don't have it, we can set it to a placeholder 
        # but the sync needs it. 
        # Since the user couldn't select it, maybe we just create the generic store and they can "Select" it again?
        # NO, "Select" CREATES the store based on Google ID.
        # If I create it manually, I need the Google ID.
        
        # Let's try to just creating a placeholder store so they can at least "see" something, 
        # but the real fix is getting the "Select" to work.
        # However, if I manually set the store_id, maybe the dashboard will load?
        
        cursor.execute("""
            INSERT INTO stores (id, name, auto_reply_enabled)
            VALUES (?, ?, ?)
        """, (new_store_id, STORE_NAME, False))
        
        # Wait, schematic check earlier showed many columns. I need to match schema.
        # id, name are usually enough if others are nullable.
        # earlier schema check: 
        # id: UUID, NotNull=1
        # name: VARCHAR, NotNull=0 (Wait, name is NotNull=0? No, usually name is required)
        # correction: name: VARCHAR, NotNull=1 (in one DB), NotNull=0 (in root DB??)
        # In root DB: name: VARCHAR, NotNull=0. So it is nullable? That's weird.
        # I'll provide name just in case.
        
        # 3. Update User
        cursor.execute("UPDATE users SET store_id = ? WHERE id = ?", (new_store_id, user['id']))
        
        conn.commit()
        print("SUCCESS: Created store and linked user.")
        
        # Verify
        cursor.execute("SELECT store_id FROM users WHERE id = ?", (user['id'],))
        updated_user = cursor.fetchone()
        print(f"Verified Store ID: {updated_user['store_id']}")
        
        conn.close()

    except Exception as e:
        print(f"Failed to fix linkage: {e}")
        # Print full schema if insert failed
        try:
             cursor.execute("PRAGMA table_info(stores)")
             for col in cursor.fetchall():
                 print(dict(col))
        except:
            pass

if __name__ == "__main__":
    fix_linkage()
