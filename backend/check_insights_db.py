from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime

def check_insights():
    db: Session = SessionLocal()
    try:
        stores = db.query(models.Store).all()
        print(f"Found {len(stores)} stores.")
        
        for store in stores:
            print(f"\n--- Store: {store.name} (ID: {store.id}) ---")
            print(f"Google Location ID: {store.google_location_id}")
            print(f"Last Synced At: {store.last_synced_at}")
            
            insights = db.query(models.Insight).filter(models.Insight.store_id == store.id).order_by(models.Insight.date.desc()).all()
            print(f"Insight Records: {len(insights)}")
            
            if insights:
                print("Latest 3 records:")
                for i in insights[:3]:
                    print(f"  Date: {i.date}, Maps: {i.views_maps}, Search: {i.views_search}, Website: {i.actions_website}, Phone: {i.actions_phone}")
            else:
                print("No insight data found for this store.")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_insights()
