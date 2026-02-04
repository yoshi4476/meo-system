import sqlite3

DB_PATH = "sql_app.db"

def migrate_users():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Starting migration...")
        
        # 1. Check existing columns to avoid errors if re-run
        cursor.execute("PRAGMA table_info(users)")
        columns = {row[1] for row in cursor.fetchall()}
        
        # 2. Rename password_hash -> hashed_password
        if "password_hash" in columns and "hashed_password" not in columns:
            print("Renaming password_hash to hashed_password...")
            cursor.execute("ALTER TABLE users RENAME COLUMN password_hash TO hashed_password")
        elif "hashed_password" in columns:
            print("hashed_password already exists.")
            
        # 3. Rename organization_id -> company_id
        if "organization_id" in columns and "company_id" not in columns:
            print("Renaming organization_id to company_id...")
            cursor.execute("ALTER TABLE users RENAME COLUMN organization_id TO company_id")
        elif "company_id" in columns:
            print("company_id already exists.")

        # 4. Add is_active if missing
        cursor.execute("PRAGMA table_info(users)") # Refresh
        columns = {row[1] for row in cursor.fetchall()}
        
        if "is_active" not in columns:
            print("Adding is_active column...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
        else:
            print("is_active already exists.")

        conn.commit()
        print("Migration completed successfully.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_users()
