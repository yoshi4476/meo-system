
import sqlite3
import os
import time

# Define paths to check
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT_DIR, "sql_app.db")

def test_write():
    print(f"Testing write to {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("DB does not exist!")
        return

    initial_mtime = os.stat(DB_PATH).st_mtime
    print(f"Initial Mtime: {initial_mtime}")

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Create a dummy table if not exists
        cursor.execute("CREATE TABLE IF NOT EXISTS test_write_check (id INTEGER PRIMARY KEY, timestamp TEXT)")
        cursor.execute("INSERT INTO test_write_check (timestamp) VALUES (?)", (str(time.time()),))
        conn.commit()
        conn.close()
        print("Write committed.")
    except Exception as e:
        print(f"Write failed: {e}")
        return

    time.sleep(1)
    final_mtime = os.stat(DB_PATH).st_mtime
    print(f"Final Mtime: {final_mtime}")
    
    if final_mtime > initial_mtime:
        print("SUCCESS: Mtime updated.")
    else:
        print("FAILURE: Mtime DID NOT update.")

if __name__ == "__main__":
    test_write()
