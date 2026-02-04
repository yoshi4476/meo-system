from sqlalchemy import create_engine, inspect
import os

DATABASE_URL = "sqlite:///./sql_app.db"  # Adjust if different

def inspect_db():
    if not os.path.exists("./sql_app.db"):
        print("Database file not found!")
        return

    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    table_names = inspector.get_table_names()
    print("Tables:", table_names)
    
    if "users" in table_names:
        print("\nColumns in 'users' table:")
        columns = inspector.get_columns("users")
        for col in columns:
            print(f"  - {col['name']} ({col['type']})")
    else:
        print("\n'users' table not found!")

if __name__ == "__main__":
    inspect_db()
