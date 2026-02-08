from sqlalchemy import text
from database import engine

def add_column_safe(conn, table, column, col_type):
    try:
        # Check if column exists (SQLite specific check, but versatile enough for simple cases)
        # For a truly DB-agnostic way, we'd inspect schema, but try/catch is robust for simple migrations.
        conn.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
        # print(f"Column '{column}' in '{table}' allready exists.") # No sync log to reduce noise
    except Exception:
        # print(f"Adding column '{column}' to '{table}'...")
        try:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            conn.commit()
            print(f"Added column: {table}.{column}")
        except Exception as e:
            print(f"Failed to add {table}.{column}: {e}")

def migrate():
    print("Starting DB Schema Migration...")
    try:
        with engine.connect() as conn:
            # Stores Table
            add_column_safe(conn, "stores", "auto_reply_enabled", "BOOLEAN DEFAULT 0")
            add_column_safe(conn, "stores", "auto_reply_prompt", "VARCHAR")
            add_column_safe(conn, "stores", "auto_reply_start_date", "TIMESTAMP")
            add_column_safe(conn, "stores", "description", "VARCHAR")
            add_column_safe(conn, "stores", "category", "VARCHAR")
            
            # Detailed Store Info
            add_column_safe(conn, "stores", "phone_number", "VARCHAR")
            add_column_safe(conn, "stores", "website_url", "VARCHAR")
            add_column_safe(conn, "stores", "zip_code", "VARCHAR")
            add_column_safe(conn, "stores", "prefecture", "VARCHAR")
            add_column_safe(conn, "stores", "city", "VARCHAR")
            add_column_safe(conn, "stores", "address_line2", "VARCHAR")
            add_column_safe(conn, "stores", "regular_hours", "JSON")
            add_column_safe(conn, "stores", "attributes", "JSON")

            # Posts Table
            add_column_safe(conn, "posts", "google_post_id", "VARCHAR")
            add_column_safe(conn, "posts", "topic_type", "VARCHAR DEFAULT 'STANDARD'")
            add_column_safe(conn, "posts", "alert_type", "VARCHAR DEFAULT 'ALERT'")
            add_column_safe(conn, "posts", "cta_type", "VARCHAR DEFAULT 'ACTION_UNSPECIFIED'")
            add_column_safe(conn, "posts", "cta_url", "VARCHAR")
            add_column_safe(conn, "posts", "event_start", "TIMESTAMP")
            add_column_safe(conn, "posts", "event_end", "TIMESTAMP")

            print("DB Schema Migration Completed.")
    except Exception as e:
        print(f"Migration Error: {e}")

if __name__ == "__main__":
    migrate()
