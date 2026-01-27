import sys
import os

# Add current directory to path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from backend.main import app, get_db
    from backend.database import engine, SessionLocal
    from backend.models import Base, User
    from backend.schemas import UserCreate
    
    print("SUCCESS: All backend modules imported successfully.")
    
    # Try creating tables
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Database tables created.")
    
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
