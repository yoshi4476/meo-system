import sys
import os
import importlib

# Add parent dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Explicitly load .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
print(f"Loading .env from: {dotenv_path}")
load_dotenv(dotenv_path)

# Import google_api AFTER loading .env
from backend.services import google_api
importlib.reload(google_api)

cid = os.getenv("GOOGLE_CLIENT_ID")
secret = os.getenv("GOOGLE_CLIENT_SECRET")
redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

print(f"--- CREDENTIALS CHECK ---")
print(f"Client IDPrefix: {cid[:10] if cid else 'None'}...")
print(f"Secret Prefix: {secret[:5] if secret else 'None'}...")
print(f"Redirect URI: {redirect_uri}")

is_default = "あなたの" in (cid or "")
print(f"Is Default/Placeholder? {'Yes' if is_default else 'No'}")

# Check Log File
log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "debug_auth.log")
print(f"--- LOG FILE CHECK ---")
print(f"Path: {log_file}")
print(f"Exists: {os.path.exists(log_file)}")

if os.path.exists(log_file):
    print("Content (Last 5 lines):")
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines[-5:]:
                print(line.strip())
    except Exception as e:
        print(f"Error reading log: {e}")
else:
    print("Log file not found (Callback never hit).")

# Simulate import of gbp to check log path logic there
from backend.routers import gbp
# Inspect indentation/path logic if possible, or just rely on above
