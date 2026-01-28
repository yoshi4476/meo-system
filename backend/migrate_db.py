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
        # Check if store_id column exists in users
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "store_id" not in columns:
            print("Migrating: Adding store_id column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN store_id TEXT")
            conn.commit()
            print("Migration successful: store_id added.")
        else:
            print("Migration skipped: store_id already exists.")
        
        # Check if last_synced_at column exists in stores
        cursor.execute("PRAGMA table_info(stores)")
        store_columns = [info[1] for info in cursor.fetchall()]
        
        if "last_synced_at" not in store_columns:
            print("Migrating: Adding last_synced_at column to stores table...")
            cursor.execute("ALTER TABLE stores ADD COLUMN last_synced_at DATETIME")
            conn.commit()
            print("Migration successful: last_synced_at added.")

        if "company_id" not in store_columns:
            print("Migrating: Adding company_id column to stores table...")
            cursor.execute("ALTER TABLE stores ADD COLUMN company_id TEXT")
            conn.commit()
            print("Migration successful: company_id added.")
            
        if "google_location_id" not in store_columns:
            print("Migrating: Adding google_location_id column to stores table...")
            cursor.execute("ALTER TABLE stores ADD COLUMN google_location_id TEXT")
            conn.commit()
            print("Migration successful: google_location_id added.")
            
        if "gbp_data" not in store_columns:
            print("Migrating: Adding gbp_data column to stores table...")
            cursor.execute("ALTER TABLE stores ADD COLUMN gbp_data JSON")
            conn.commit()
            print("Migration successful: gbp_data added.")
            
        if "address" not in store_columns:
            print("Migrating: Adding address column to stores table...")
            cursor.execute("ALTER TABLE stores ADD COLUMN address TEXT")
            conn.commit()
            print("Migration successful: address added.")

        # Check posts table
        cursor.execute("PRAGMA table_info(posts)")
        post_columns = [info[1] for info in cursor.fetchall()]
        
        if "media_url" not in post_columns:
            print("Migrating: Adding media_url column to posts table...")
            cursor.execute("ALTER TABLE posts ADD COLUMN media_url TEXT")
            conn.commit()
            print("Migration successful: media_url added.")

        if "created_at" not in post_columns:
            print("Migrating: Adding created_at column to posts table...")
            cursor.execute("ALTER TABLE posts ADD COLUMN created_at DATETIME")
            conn.commit()
            print("Migration successful: created_at added.")
        
        # Check reviews table
        cursor.execute("PRAGMA table_info(reviews)")
        review_columns = [info[1] for info in cursor.fetchall()]

        if "google_review_id" not in review_columns:
            print("Migrating: Adding google_review_id to reviews...")
            cursor.execute("ALTER TABLE reviews ADD COLUMN google_review_id TEXT")
            conn.commit()
            print("Migration successful: google_review_id added.")
        
        if "reviewer_name" not in review_columns:
            print("Migrating: Adding reviewer_name to reviews...")
            cursor.execute("ALTER TABLE reviews ADD COLUMN reviewer_name TEXT")
            conn.commit()
            print("Migration successful: reviewer_name added.")

        if "reply_comment" not in review_columns:
            print("Migrating: Adding reply_comment to reviews...")
            cursor.execute("ALTER TABLE reviews ADD COLUMN reply_comment TEXT")
            conn.commit()
            print("Migration successful: reply_comment added.")

        if "reply_time" not in review_columns:
            print("Migrating: Adding reply_time to reviews...")
            cursor.execute("ALTER TABLE reviews ADD COLUMN reply_time DATETIME")
            conn.commit()
            print("Migration successful: reply_time added.")

        if "create_time" not in review_columns:
            print("Migrating: Adding create_time to reviews...")
            cursor.execute("ALTER TABLE reviews ADD COLUMN create_time DATETIME")
            conn.commit()
            print("Migration successful: create_time added.")

        if "update_time" not in review_columns:
            print("Migrating: Adding update_time to reviews...")
            cursor.execute("ALTER TABLE reviews ADD COLUMN update_time DATETIME")
            conn.commit()
            print("Migration successful: update_time added.")

        # Check media_items table
        cursor.execute("PRAGMA table_info(media_items)")
        media_columns = [info[1] for info in cursor.fetchall()]
        
        if "google_media_id" not in media_columns:
            print("Migrating: Adding google_media_id to media_items...")
            cursor.execute("ALTER TABLE media_items ADD COLUMN google_media_id TEXT")
            conn.commit()
            print("Migration successful: google_media_id added.")

        # Check questions table
        cursor.execute("PRAGMA table_info(questions)")
        q_columns = [info[1] for info in cursor.fetchall()]
        
        if "google_question_id" not in q_columns:
            print("Migrating: Adding google_question_id to questions...")
            cursor.execute("ALTER TABLE questions ADD COLUMN google_question_id TEXT")
            conn.commit()
            print("Migration successful: google_question_id added.")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
