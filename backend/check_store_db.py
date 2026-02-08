
import sqlite3
import os
import json

# Define paths to check
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
POTENTIAL_DB_PATHS = [
    os.path.join(BACKEND_DIR, "sql_app.db"),
    os.path.join(ROOT_DIR, "sql_app.db"),
    os.path.join(ROOT_DIR, "backend", "sql_app.db")
]

def check_store_details():
    for db_path in POTENTIAL_DB_PATHS:
        if not os.path.exists(db_path):
            continue

        print(f"\n======== Checking DB at: {db_path} ========")
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, name, google_location_id, phone_number, website_url, regular_hours, attributes, last_synced_at FROM stores")
            stores = cursor.fetchall()
            
            if not stores:
                print("No stores found in DB.")
            
            for store in stores:
                print(f"--- Store: {store['name']} ({store['id']}) ---")
                print(f"  Google Location ID: {store['google_location_id']}")
                print(f"  Last Synced: {store['last_synced_at']}")
                print(f"  Phone: {store['phone_number']}")
                print(f"  Website: {store['website_url']}")
                
                hours = store['regular_hours']
                if hours:
                    print(f"  Hours (Raw): {str(hours)[:50]}...")
                else:
                     print("  Hours: None")
                
                attrs = store['attributes']
                if attrs:
                    print(f"  Attributes (Raw): {str(attrs)[:50]}...")
                else:
                    print("  Attributes: None")
                print("-" * 30)

            print("\n=== Schema Check (stores) ===")
            cursor.execute("PRAGMA table_info(stores)")
            columns = cursor.fetchall()
            for col in columns:
                # cid, name, type, notnull, dflt_value, pk
                print(f"  {col['name']}: Type={col['type']}, NotNull={col['notnull']}")

            print("\n=== Checking Users ===")
            cursor.execute("SELECT id, email, store_id, company_id FROM users")
            users = cursor.fetchall()
            for user in users:
                 print(f"User: {user['email']} (ID: {user['id']})")
                 print(f"  Linked Store ID: {user['store_id']}")
                 print(f"  Company ID: {user['company_id']}")
                 
                 # Check Google Connection
                 cursor.execute("SELECT * FROM google_connections WHERE user_id = ?", (user['id'],))
                 conn_record = cursor.fetchone()
                 if conn_record:
                     print(f"  Google Connection: YES (ID: {conn_record['id']})")
                 else:
                     print(f"  Google Connection: NO")

                 # Try to find store name
                 store_name = "Unknown"
                 for s in stores:
                     if s['id'] == user['store_id']:
                         store_name = s['name']
                         break
                 print(f"  Store Name: {store_name}")
                 print("-" * 20)
                
            conn.close()
        except Exception as e:
            print(f"Error checking DB: {e}")

    # Check for debug.log
    print("\n======== Checking debug.log ========")
    log_paths = [
        os.path.join(BACKEND_DIR, "debug.log"),
        os.path.join(ROOT_DIR, "debug.log"),
        os.path.join(ROOT_DIR, "backend", "debug.log")
    ]
    for log_path in log_paths:
        if os.path.exists(log_path):
            print(f"Found log at: {log_path}")
            try:
                with open(log_path, "r", encoding="utf-8") as f:
                    print(f.read())
            except Exception as e:
                print(f"Error reading log: {e}")
        else:
            print(f"Log not found at: {log_path}")

    # Check file stats
    print("\n======== DB File Stats ========")
    for db_path in POTENTIAL_DB_PATHS:
        if os.path.exists(db_path):
            stat = os.stat(db_path)
            print(f"{db_path}: Size={stat.st_size}, Mtime={stat.st_mtime}")

if __name__ == "__main__":
    check_store_details()
