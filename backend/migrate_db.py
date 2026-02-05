import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('sql_app.db')
        cursor = conn.cursor()
        print("Checking if auto_reply_start_date column exists...")
        try:
            cursor.execute("SELECT auto_reply_start_date FROM stores LIMIT 1")
            print("Column already exists.")
        except sqlite3.OperationalError:
            print("Column missing. Adding auto_reply_start_date...")
            cursor.execute("ALTER TABLE stores ADD COLUMN auto_reply_start_date DATETIME")
            print("Column added successfully.")
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
