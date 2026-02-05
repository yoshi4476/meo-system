from sqlalchemy import text
from database import engine

def migrate():
    try:
        with engine.connect() as conn:
            print("Checking if auto_reply_start_date column exists...")
            try:
                # Attempt to select the column
                conn.execute(text("SELECT auto_reply_start_date FROM stores LIMIT 1"))
                print("Column 'auto_reply_start_date' already exists.")
            except Exception:
                print("Column missing or error. Attempting to add 'auto_reply_start_date'...")
                # Note: Transaction handling varies by DB. SQLAlchemy autocommit might be needed or explicit commit.
                # For schema changes, it's safer to execute properly.
                try:
                    conn.execute(text("ALTER TABLE stores ADD COLUMN auto_reply_start_date DATETIME"))
                    conn.commit()
                    print("Column added successfully.")
                except Exception as e:
                    print(f"Failed to add column: {e}")
                    # Could be that it exists but select failed (e.g. valid row missing)?
                    # But keeping it simple.
    except Exception as e:
        print(f"Migration Error: {e}")

if __name__ == "__main__":
    migrate()
