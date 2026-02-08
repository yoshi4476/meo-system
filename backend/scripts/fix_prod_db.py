
import sqlite3
import os

# Target both possible DBs
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # .../backend
ROOT_DIR = os.path.dirname(BACKEND_DIR) # .../MEOシステム

DB_PATHS = [
    os.path.join(BACKEND_DIR, "sql_app.db"),
    os.path.join(ROOT_DIR, "sql_app.db")
]

def add_column_if_not_exists(cursor, table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"Added column {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e) or "no such table" in str(e): 
             print(f"Skipping {column} (already exists or table missing): {e}")
        else:
             print(f"Error adding {column}: {e}")

for db_path in DB_PATHS:
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}, skipping.")
        continue
        
    print(f"Migrating DB at: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 1. Add Auto Reply Columns (if missing)
        add_column_if_not_exists(cursor, "stores", "auto_reply_enabled", "BOOLEAN DEFAULT 0")
        add_column_if_not_exists(cursor, "stores", "auto_reply_prompt", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "auto_reply_start_date", "DATETIME")
        add_column_if_not_exists(cursor, "stores", "description", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "category", "VARCHAR")

        # 2. Add Detailed Store Info Columns
        add_column_if_not_exists(cursor, "stores", "phone_number", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "website_url", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "zip_code", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "prefecture", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "city", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "address_line2", "VARCHAR")
        add_column_if_not_exists(cursor, "stores", "regular_hours", "JSON")
        add_column_if_not_exists(cursor, "stores", "attributes", "JSON")

        # 3. Add Missing Post Columns (if missing)
        add_column_if_not_exists(cursor, "posts", "google_post_id", "VARCHAR")
        add_column_if_not_exists(cursor, "posts", "topic_type", "VARCHAR DEFAULT 'STANDARD'")
        add_column_if_not_exists(cursor, "posts", "alert_type", "VARCHAR DEFAULT 'ALERT'")
        add_column_if_not_exists(cursor, "posts", "cta_type", "VARCHAR DEFAULT 'ACTION_UNSPECIFIED'")
        add_column_if_not_exists(cursor, "posts", "cta_url", "VARCHAR")
        add_column_if_not_exists(cursor, "posts", "event_start", "DATETIME")
        add_column_if_not_exists(cursor, "posts", "event_end", "DATETIME")

        conn.commit()
        conn.close()
        print(f"Migration completed for {db_path}")
    except Exception as e:
        print(f"Failed to migrate {db_path}: {e}")
