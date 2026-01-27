from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/insights",
    tags=["insights"],
)

@router.get("/{store_id}")
def get_insights(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get performance metrics from Google Business Profile for the last 28 days.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store or not store.google_location_id:
        raise HTTPException(status_code=400, detail="Store not linked to Google Business Profile")
    
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        # Fallback to fetching stored tokens if current user is not the one connected?
        # For now strict check.
        raise HTTPException(status_code=400, detail="Google account not connected")
        
    client = google_api.GBPClient(connection.access_token)
    
    # Calculate date range: Last 30 days (excluding today usually, to be safe last 1-30 days ago)
    end_date_dt = datetime.now() - timedelta(days=2)
    start_date_dt = end_date_dt - timedelta(days=28)
    
    start_date = {"year": start_date_dt.year, "month": start_date_dt.month, "day": start_date_dt.day}
    end_date = {"year": end_date_dt.year, "month": end_date_dt.month, "day": end_date_dt.day}
    
    try:
        data = client.fetch_performance_metrics(store.google_location_id, start_date, end_date)
        
        # Process data for frontend
        # Google returns list of MultiDailyMetricTimeSeries
        # We want to aggregate or simplify
        return {
            "period": f"{start_date_dt.strftime('%Y-%m-%d')} - {end_date_dt.strftime('%Y-%m-%d')}",
            "metrics": data.get("multiDailyMetricTimeSeries", [])
        }
    except Exception as e:
        print(f"Insights Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
