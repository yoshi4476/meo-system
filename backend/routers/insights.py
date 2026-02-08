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
def get_insights(
    store_id: str, 
    start_date: str = None, 
    end_date: str = None,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get performance metrics from local DB.
    Refreshed via /sync endpoint.
    Optional start_date/end_date (YYYY-MM-DD). Default last 30 days.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=400, detail="Store not found")
    
    # Determine Date Range
    if end_date:
        try:
            end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
        except:
            end_date_dt = datetime.now()
    else:
        end_date_dt = datetime.now()

    if start_date:
         try:
            start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")
         except:
            start_date_dt = end_date_dt - timedelta(days=30)
    else:
        start_date_dt = end_date_dt - timedelta(days=30) # Default 30 days

    # Fetch from local DB (Synced Data)
    query = db.query(models.Insight).filter(
        models.Insight.store_id == store_id
    )
    
    # Filter by date range
    query = query.filter(models.Insight.date >= start_date_dt.date())
    query = query.filter(models.Insight.date <= end_date_dt.date())
    
    insights = query.order_by(models.Insight.date.asc()).all()
    
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
    
    total_impressions = total_maps + total_search
    total_actions = total_website + total_phone + total_directions
    
    # 来店率予測 (業界平均ベンチマーク)
    # マップ表示の約3-5%が来店につながる (飲食店業界平均)
    # アクション(電話・ルート検索)の約30-50%が来店につながる
    map_to_visit_rate = 0.04  # 4%
    action_to_visit_rate = 0.40  # 40%
    
    estimated_visits_from_maps = int(total_maps * map_to_visit_rate)
    estimated_visits_from_actions = int(total_actions * action_to_visit_rate)
    total_estimated_visits = estimated_visits_from_maps + estimated_visits_from_actions
    
    # 変換率
    action_rate = (total_actions / total_impressions * 100) if total_impressions > 0 else 0
    
    # Platform/Device breakdown (Desktop vs Mobile)
    # We need to track Desktop vs Mobile separately if possible
    # For now calculate from available data or estimate based on industry averages
    # Typically Mobile is 75-85% of traffic for local businesses
    mobile_ratio = 0.80
    desktop_ratio = 0.20
    
    platform_breakdown = {
        "mobile_maps": int(total_maps * mobile_ratio),
        "desktop_maps": int(total_maps * desktop_ratio),
        "mobile_search": int(total_search * mobile_ratio),
        "desktop_search": int(total_search * desktop_ratio),
        "mobile_total": int(total_impressions * mobile_ratio),
        "desktop_total": int(total_impressions * desktop_ratio),
    }
    
    # --- Calculate Comparison (Previous Period) ---
    # Current Period: start_date_dt to end_date_dt (approx 30 days)
    # Previous Period: start_date_dt - (end_date_dt - start_date_dt) to start_date_dt
    
    period_days = (end_date_dt - start_date_dt).days
    prev_end_date = start_date_dt - timedelta(days=1)
    prev_start_date = prev_end_date - timedelta(days=period_days)
    
    prev_query = db.query(models.Insight).filter(
        models.Insight.store_id == store_id,
        models.Insight.date >= prev_start_date.date(),
        models.Insight.date <= prev_end_date.date()
    )
    prev_insights = prev_query.all()
    
    prev_total_maps = sum(i.views_maps or 0 for i in prev_insights)
    prev_total_search = sum(i.views_search or 0 for i in prev_insights)
    prev_total_website = sum(i.actions_website or 0 for i in prev_insights)
    prev_total_phone = sum(i.actions_phone or 0 for i in prev_insights)
    prev_total_directions = sum(i.actions_driving_directions or 0 for i in prev_insights)
    
    def calc_change(current, previous):
        if previous == 0:
            return 0 if current == 0 else 100
        return ((current - previous) / previous) * 100

    comparison = {
        "map_views_change": calc_change(total_maps, prev_total_maps),
        "search_views_change": calc_change(total_search, prev_total_search),
        "website_clicks_change": calc_change(total_website, prev_total_website),
        "phone_calls_change": calc_change(total_phone, prev_total_phone),
        "direction_requests_change": calc_change(total_directions, prev_total_directions),
        "total_impressions_change": calc_change(total_impressions, (prev_total_maps + prev_total_search)),
    }

    return {
        "period": f"{start_date_dt.strftime('%Y/%m/%d')} - {end_date_dt.strftime('%Y/%m/%d')}",
        "days_count": len(insights),
        "summary": {
            "total_impressions": total_impressions,
            "map_views": total_maps,
            "search_views": total_search,
            "website_clicks": total_website,
            "phone_calls": total_phone,
            "direction_requests": total_directions,
            "total_actions": total_actions,
        },
        "comparison": comparison,
        "predictions": {
            "estimated_visits": total_estimated_visits,
            "visits_from_maps": estimated_visits_from_maps,
            "visits_from_actions": estimated_visits_from_actions,
            "action_rate_percent": round(action_rate, 2),
            "map_conversion_rate": map_to_visit_rate * 100,
            "action_conversion_rate": action_to_visit_rate * 100,
        },
        "platform_breakdown": platform_breakdown,
        "metrics": metrics
    }


@router.get("/{store_id}/keywords")
def get_search_keywords(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get search keywords that led users to find this business profile.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store or not store.google_location_id:
        raise HTTPException(status_code=400, detail="Store not linked to Google Business Profile")
    
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    # Refresh token if expired
    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            try:
                new_tokens = google_api.refresh_access_token(connection.refresh_token)
                connection.access_token = new_tokens.get("access_token")
                connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
                db.commit()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Token refresh failed: {str(e)}")
    
    client = google_api.GBPClient(connection.access_token)
    
    # Resolve correct location name (v1 or v4 format depending on what API needs, 
    # but Performance API documentation says 'locations/{locationId}'.
    # However, sometimes we need to be careful with the ID. 
    # Let's try to verify or resolve if we suspect issues, similar to QA.)
    
    # Actually, Performance API `locations/{locationId}` refers to the obfuscated ID.
    # If store.google_location_id is `locations/123...`, it SHOULD work.
    
    # Retrying logic: If first attempt fails, maybe try to resolve via accounts?
    # Or maybe the token scopes?
    
    target_location_name = store.google_location_id
    
    # Logic to fetch keywords
    def fetch_keywords_for_month(year, month):
        try:
             res = client.fetch_search_keywords(target_location_name, year, month)
             return res
        except Exception as e:
            print(f"Fetch keywords failed for {year}-{month}: {e}")
            return None

    # Try last month
    now = datetime.now()
    if now.month == 1:
        target_year = now.year - 1
        target_month = 12
    else:
        target_year = now.year
        target_month = now.month - 1
        
    keywords_data = fetch_keywords_for_month(target_year, target_month)
    
    # If failed or empty, try 2 months ago? 
    # Sometimes data is delayed.
    if not keywords_data or not keywords_data.get("searchKeywordsCounts"):
        # Try 2 months ago
        if target_month == 1:
            prev_year = target_year - 1
            prev_month = 12
        else:
            prev_year = target_year
            prev_month = target_month - 1
            
        print(f"Retrying keywords for {prev_year}-{prev_month}")
        keywords_data_prev = fetch_keywords_for_month(prev_year, prev_month)
        if keywords_data_prev and keywords_data_prev.get("searchKeywordsCounts"):
            keywords_data = keywords_data_prev
            target_year = prev_year
            target_month = prev_month
            
    if not keywords_data:
         # Final fallback: return empty with error message if it was an error
         return {
            "period": "データ取得失敗",
            "keywords": [],
            "total_keywords": 0,
            "error": "Google APIからデータを取得できませんでした。権限または期間外の可能性があります。"
        }

    try:
        # Format response
        keywords = []
        for kw in keywords_data.get("searchKeywordsCounts", []):
            search_keyword = kw.get("searchKeyword", "")
            insights_value = kw.get("insightsValue", {})
            value = insights_value.get("value") or insights_value.get("threshold", 0)
            keywords.append({
                "keyword": search_keyword,
                "impressions": int(value) if value else 0
            })
        
        # Sort by impressions descending
        keywords.sort(key=lambda x: x["impressions"], reverse=True)
        
        return {
            "period": f"{target_year}年{target_month}月",
            "keywords": keywords[:20],  # Top 20
            "total_keywords": len(keywords)
        }
    except Exception as e:
        return {
            "period": "データ処理エラー",
            "keywords": [],
            "total_keywords": 0,
            "error": str(e)
        }

