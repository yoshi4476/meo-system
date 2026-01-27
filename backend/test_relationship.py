
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload
from models import Base, User, Store, GoogleConnection
import os
import uuid

# Setup DB
DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def test_relationship():
    # 1. Create User
    user_email = f"test_{uuid.uuid4()}@example.com"
    user = User(email=user_email, id=str(uuid.uuid4()))
    db.add(user)
    db.commit()
    print(f"Created User: {user.id}")

    # 2. Create Store
    store = Store(id=str(uuid.uuid4()), name="Test Store", google_location_id="loc_123")
    db.add(store)
    db.commit()
    print(f"Created Store: {store.id}")

    # 3. Link them
    user.store_id = store.id
    db.commit()
    print(f"Linked User to Store")

    # 4. Fetch with joinedload
    fetched_user = db.query(User).options(
        joinedload(User.store)
    ).filter(User.id == user.id).first()

    if fetched_user.store:
        print(f"SUCCESS: Fetched user has store: {fetched_user.store.name} ({fetched_user.store.google_location_id})")
    else:
        print("FAILURE: Fetched user has NO store")

    # Clean up
    db.delete(user)
    db.delete(store)
    db.commit()

if __name__ == "__main__":
    test_relationship()
