from fastapi import APIRouter, Depends, HTTPException, Header as APIHeader
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import models, database, auth
from services import report_generator, ai_generator
from datetime import datetime, timedelta
from io import StringIO
import csv

import logging
import traceback

logger = logging.getLogger(__name__)

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
def download_report(
    store_id: str, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user),
    x_openai_api_key: str = APIHeader(None, alias="X-OpenAI-Api-Key")
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    try:
        # 1. Fetch Insights (aggregate from DB)
        insights = db.query(models.Insight).filter(
            models.Insight.store_id == store_id
        ).order_by(models.Insight.date.desc()).limit(30).all()
        
        insight_data = {
            "views_search": sum(i.views_search or 0 for i in insights),
            "views_maps": sum(i.views_maps or 0 for i in insights),
            "actions_website": sum(i.actions_website or 0 for i in insights),
            "actions_phone": sum(i.actions_phone or 0 for i in insights),
        }
        
        # 2. Fetch Sentiment - with fallback if AI fails
        sentiment_data = {
            "summary": "データなし",
            "sentiment_score": 50,
            "positive_points": [],
            "negative_points": []
        }
        
        try:
            reviews = db.query(models.Review).filter(models.Review.store_id == store_id).order_by(models.Review.create_time.desc()).limit(10).all()
            logger.info(f"Found {len(reviews)} reviews for store {store_id}")
            if reviews:
                review_data = [{"text": r.comment, "rating": r.star_rating} for r in reviews if r.comment]
                logger.info(f"Reviews with comments: {len(review_data)}")
                if review_data and x_openai_api_key:
                    client = ai_generator.AIClient(api_key=x_openai_api_key)
                    sentiment_data = client.analyze_sentiment(review_data)
                elif not x_openai_api_key:
                    logger.warning("No OpenAI API key provided for sentiment analysis")
        except Exception as e:
            logger.error(f"AI sentiment analysis failed (non-critical): {e}")
            traceback.print_exc()
            # Continue with fallback sentiment_data
        
        # Generate PDF
        logger.info(f"Generating PDF for store {store.name}")
        generator = report_generator.ReportGenerator()
        pdf_buffer = generator.generate_report(store.name, insight_data, sentiment_data)
        
        filename = f"report_{store.name}_{datetime.now().strftime('%Y%m')}.pdf"
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"PDF Request Failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF生成エラー: {str(e)}")

