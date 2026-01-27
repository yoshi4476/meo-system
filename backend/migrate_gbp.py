
import sqlite3
import os

DB_PATH = "./sql_app.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if gbp_data column exists
        cursor.execute("PRAGMA table_info(stores)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "gbp_data" not in columns:
            print("Adding gbp_data column to stores table...")
            cursor.execute("ALTER TABLE stores ADD COLUMN gbp_data JSON")
            conn.commit()
            print("Migration successful.")
        else:
            print("gbp_data column already exists.")

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
