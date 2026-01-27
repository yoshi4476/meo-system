import sqlite3
import os

DB_FILE = "./sql_app.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found. Skipping migration.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        # Check if store_id column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "store_id" not in columns:
            print("Migrating: Adding store_id column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN store_id TEXT")
            conn.commit()
            print("Migration successful: store_id added.")
        else:
            print("Migration skipped: store_id already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
