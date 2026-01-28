from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import models, database, auth
from services import report_generator, ai_generator
from datetime import datetime

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)

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
