import sqlite3
import os

DB_PATH = "../sql_app.db"

def add_columns():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    columns_to_add = [
        ("auto_reply_enabled", "BOOLEAN DEFAULT 0"),
        ("auto_reply_prompt", "VARCHAR"),
        ("auto_reply_start_date", "DATETIME"),
        ("description", "VARCHAR"),
        ("category", "VARCHAR")
    ]

    for col_name, col_type in columns_to_add:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE stores ADD COLUMN {col_name} {col_type}")
            print(f"  - Added {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print(f"  - Column {col_name} already exists.")
            else:
                print(f"  - Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    add_columns()
