import sqlite3
import os

DB_PATH = "../sql_app.db"

def migrate_root_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print(f"Starting migration for {DB_PATH}...")
        
        # --- USERS TABLE ---
        cursor.execute("PRAGMA table_info(users)")
        u_cols = {row[1] for row in cursor.fetchall()}
        
        if "password_hash" in u_cols and "hashed_password" not in u_cols:
            print("Renaming users.password_hash -> hashed_password")
            cursor.execute("ALTER TABLE users RENAME COLUMN password_hash TO hashed_password")
            
        if "organization_id" in u_cols and "company_id" not in u_cols:
            print("Renaming users.organization_id -> company_id")
            cursor.execute("ALTER TABLE users RENAME COLUMN organization_id TO company_id")

        cursor.execute("PRAGMA table_info(users)")
        u_cols = {row[1] for row in cursor.fetchall()}
        if "is_active" not in u_cols:
            print("Adding users.is_active")
            cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")

        # --- STORES TABLE ---
        cursor.execute("PRAGMA table_info(stores)")
        s_cols = {row[1] for row in cursor.fetchall()}
        
        if "last_synced_at" not in s_cols:
            print("Adding stores.last_synced_at")
            cursor.execute("ALTER TABLE stores ADD COLUMN last_synced_at DATETIME")
            
        if "gbp_data" not in s_cols:
            print("Adding stores.gbp_data")
            cursor.execute("ALTER TABLE stores ADD COLUMN gbp_data JSON")

        conn.commit()
        print("Migration completed successfully.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_root_db()
