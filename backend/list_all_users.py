import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import models

def list_users():
    print(f"Database URL: {database.SQLALCHEMY_DATABASE_URL}")
    db = database.SessionLocal()
    try:
        users = db.query(models.User).all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"ID: {u.id}, Email: '{u.email}', Role: {u.role}, StoreID: {u.store_id}")
            if u.google_connection:
                print(f"  -> Has Google Connection (Token)")
            else:
                print(f"  -> NO Google Connection")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
