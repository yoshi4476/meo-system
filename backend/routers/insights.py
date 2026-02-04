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
    
    # Fetch from local DB (Synced Data)
    insights = db.query(models.Insight).filter(
        models.Insight.store_id == store_id
    ).order_by(models.Insight.date.asc()).all()
    
    # Format for Frontend (match Google API structure approx or simplify)
    # Frontend expects: { metrics: [ { dailyMetric: "KEY", dailyMetricTimeSeries: [{date, value}] } ] }
    
    if not insights:
        return {"period": "No Data", "metrics": []}

    # Reshape Data
    data_map = {
        "BUSINESS_IMPRESSIONS_DESKTOP_MAPS": [],
        "BUSINESS_IMPRESSIONS_MOBILE_MAPS": [], # We split in DB? Only stored total views_maps. Let's send same to both or split generic?
        # Actually DB has: views_maps, views_search.
        # Google provides breakdown. If we only stored aggregate, we can't fully reconstruct breakdown perfectly.
        # But we can map "views_maps" -> "BUSINESS_IMPRESSIONS_DESKTOP_MAPS" (or just rename frontend calls?)
        # Let's map 1:1 where possible.
        "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH": [],
        "BUSINESS_IMPRESSIONS_MOBILE_SEARCH": [],
        "WEBSITE_CLICKS": [],
        "CALL_CLICKS": [],
        "DRIVING_DIRECTIONS_CLICKS": []
    }
    
    # DB 'views_maps' combines desktop/mobile. We'll assign it to 'MOBILE_MAPS' for simplicity or split?
    # Let's assign to MOBILE_MAPS effectively.
    
    for i in insights:
        d = {"year": i.date.year, "month": i.date.month, "day": i.date.day}
        
        # Maps
        if i.views_maps is not None:
             data_map["BUSINESS_IMPRESSIONS_MOBILE_MAPS"].append({"date": d, "value": str(i.views_maps)})
             
        # Search
        if i.views_search is not None:
             data_map["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"].append({"date": d, "value": str(i.views_search)})
             
        # Actions
        if i.actions_website is not None:
             data_map["WEBSITE_CLICKS"].append({"date": d, "value": str(i.actions_website)})
             
        if i.actions_phone is not None:
             data_map["CALL_CLICKS"].append({"date": d, "value": str(i.actions_phone)})
             
        if i.actions_driving_directions is not None:
             data_map["DRIVING_DIRECTIONS_CLICKS"].append({"date": d, "value": str(i.actions_driving_directions)})

    metrics = []
    for k, v in data_map.items():
        if v:
            metrics.append({"dailyMetric": k, "dailyMetricTimeSeries": v})

    # Calculate summary statistics
    total_maps = sum(i.views_maps or 0 for i in insights)
    total_search = sum(i.views_search or 0 for i in insights)
    total_website = sum(i.actions_website or 0 for i in insights)
    total_phone = sum(i.actions_phone or 0 for i in insights)
    total_directions = sum(i.actions_driving_directions or 0 for i in insights)
    
    return {
        "period": "Last 30 Days (Synced)",
        "days_count": len(insights),
        "summary": {
            "total_impressions": total_maps + total_search,
            "map_views": total_maps,
            "search_views": total_search,
            "website_clicks": total_website,
            "phone_calls": total_phone,
            "direction_requests": total_directions,
            "total_actions": total_website + total_phone + total_directions,
        },
        "metrics": metrics
    }
