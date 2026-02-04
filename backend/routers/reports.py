from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import models, database, auth
from services import report_generator, ai_generator
from datetime import datetime, timedelta
from io import StringIO
import csv

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)

@router.get("/monthly/{store_id}")
def get_monthly_report(
    store_id: str, 
    year: int = None, 
    month: int = None,
    format: str = "json",
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    月次パフォーマンスレポートを生成
    format: "json", "csv"
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # デフォルトは先月
    if not year or not month:
        last_month = datetime.now().replace(day=1) - timedelta(days=1)
        year = last_month.year
        month = last_month.month
    
    # 月の開始日と終了日
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)
    
    # インサイトデータ取得
    insights = db.query(models.Insight).filter(
        models.Insight.store_id == store_id,
        models.Insight.date >= start_date,
        models.Insight.date <= end_date
    ).order_by(models.Insight.date.asc()).all()
    
    # レビュー統計
    reviews = db.query(models.Review).filter(
        models.Review.store_id == store_id,
        models.Review.create_time >= start_date,
        models.Review.create_time <= end_date
    ).all()
    
    # 投稿統計
    posts = db.query(models.Post).filter(
        models.Post.store_id == store_id,
        models.Post.created_at >= start_date,
        models.Post.created_at <= end_date
    ).all()
    
    # 集計
    total_views_maps = sum(i.views_maps or 0 for i in insights)
    total_views_search = sum(i.views_search or 0 for i in insights)
    total_website_clicks = sum(i.actions_website or 0 for i in insights)
    total_phone_clicks = sum(i.actions_phone or 0 for i in insights)
    total_directions = sum(i.actions_driving_directions or 0 for i in insights)
    
    avg_rating = sum(r.star_rating or 0 for r in reviews) / len(reviews) if reviews else 0
    
    report_data = {
        "store_name": store.name,
        "period": f"{year}年{month}月",
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_impressions": total_views_maps + total_views_search,
            "map_views": total_views_maps,
            "search_views": total_views_search,
            "website_clicks": total_website_clicks,
            "phone_calls": total_phone_clicks,
            "direction_requests": total_directions,
            "total_actions": total_website_clicks + total_phone_clicks + total_directions,
        },
        "reviews": {
            "count": len(reviews),
            "average_rating": round(avg_rating, 2),
            "replied_count": sum(1 for r in reviews if r.reply),
        },
        "posts": {
            "count": len(posts),
            "published_count": sum(1 for p in posts if p.status == 'PUBLISHED'),
        },
        "daily_breakdown": [
            {
                "date": i.date.strftime("%Y-%m-%d"),
                "views_maps": i.views_maps or 0,
                "views_search": i.views_search or 0,
                "website_clicks": i.actions_website or 0,
                "phone_calls": i.actions_phone or 0,
                "directions": i.actions_driving_directions or 0,
            }
            for i in insights
        ]
    }
    
    if format == "csv":
        output = StringIO()
        writer = csv.writer(output)
        
        # ヘッダー情報
        writer.writerow(["月次パフォーマンスレポート"])
        writer.writerow(["店舗名", store.name])
        writer.writerow(["期間", f"{year}年{month}月"])
        writer.writerow([])
        
        # サマリー
        writer.writerow(["サマリー"])
        writer.writerow(["総表示回数", report_data["summary"]["total_impressions"]])
        writer.writerow(["マップ表示", report_data["summary"]["map_views"]])
        writer.writerow(["検索表示", report_data["summary"]["search_views"]])
        writer.writerow(["ウェブサイトクリック", report_data["summary"]["website_clicks"]])
        writer.writerow(["電話発信", report_data["summary"]["phone_calls"]])
        writer.writerow(["ルート検索", report_data["summary"]["direction_requests"]])
        writer.writerow([])
        
        # 日次データ
        writer.writerow(["日次データ"])
        writer.writerow(["日付", "マップ表示", "検索表示", "ウェブクリック", "電話", "ルート"])
        for day in report_data["daily_breakdown"]:
            writer.writerow([
                day["date"], 
                day["views_maps"], 
                day["views_search"],
                day["website_clicks"],
                day["phone_calls"],
                day["directions"]
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{year}_{month}.csv"}
        )
    
    return report_data

@router.get("/download/{store_id}")
def download_report(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    # 1. Fetch Insights (Mock or Real latest)
    # Just getting the latest entry
    insight = db.query(models.Insight).filter(models.Insight.store_id == store_id).order_by(models.Insight.date.desc()).first()
    insight_data = {
        "views_search": insight.views_search if insight else 0,
        "views_maps": insight.views_maps if insight else 0,
        "actions_website": insight.actions_website if insight else 0,
        "actions_phone": insight.actions_phone if insight else 0,
    }
    
    # 2. Fetch Sentiment (Mock or trigger AI)
    # We'll just fetch reviews and analyze quickly or use stored data if we had it
    # For speed, let's mock the sentiment part for the report or do a quick analysis
    client = ai_generator.AIClient()
    reviews = db.query(models.Review).filter(models.Review.store_id == store_id).order_by(models.Review.create_time.desc()).limit(10).all()
    review_data = [{"text": r.comment, "rating": r.star_rating} for r in reviews if r.comment]
    sentiment_data = client.analyze_sentiment(review_data)
    
    # Generate PDF
    generator = report_generator.ReportGenerator()
    pdf_buffer = generator.generate_report(store.name, insight_data, sentiment_data)
    
    filename = f"report_{store.name}_{datetime.now().strftime('%Y%m')}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

