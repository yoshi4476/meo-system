
import os
import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT_DIR, "sql_app.db")
BACKEND_DB_PATH = os.path.join(ROOT_DIR, "backend", "sql_app.db")

def check_time():
    now = datetime.datetime.now().timestamp()
    print(f"Current Timestamp: {now}")
    
    if os.path.exists(DB_PATH):
        mtime = os.stat(DB_PATH).st_mtime
        diff = now - mtime
        print(f"Root DB Mtime: {mtime} (Diff: {diff:.2f} seconds ago)")
        print(f"Human Time: {datetime.datetime.fromtimestamp(mtime)}")
        
    if os.path.exists(BACKEND_DB_PATH):
        mtime = os.stat(BACKEND_DB_PATH).st_mtime
        diff = now - mtime
        print(f"Backend DB Mtime: {mtime} (Diff: {diff:.2f} seconds ago)")
        print(f"Human Time: {datetime.datetime.fromtimestamp(mtime)}")

if __name__ == "__main__":
    check_time()
