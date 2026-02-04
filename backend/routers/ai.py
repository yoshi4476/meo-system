from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import ai_generator
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)

class GeneratePostRequest(BaseModel):
    keywords: str
    length_option: str # SHORT, MEDIUM, LONG
    tone: str = "friendly"
    char_count: Optional[int] = None
    custom_prompt: Optional[str] = None
    keywords_region: Optional[str] = None
    # Future: reuse_photo_id

class GenerateReplyRequest(BaseModel):
    review_text: str
    reviewer_name: str
    star_rating: str # "FIVE", "4", etc.
    tone: str = "polite"

class PromptCreate(BaseModel):
    title: str
    content: str
    category: str # POST_GENERATION, REVIEW_REPLY
    is_locked: bool = False

class PromptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_locked: Optional[bool] = None

@router.post("/generate/post")
def generate_post(req: GeneratePostRequest, current_user: models.User = Depends(auth.get_current_user)):
    try:
        client = ai_generator.AIClient()
        content = client.generate_post_content(
            keywords=req.keywords, 
            length_option=req.length_option, 
            tone=req.tone,
            custom_prompt=req.custom_prompt,
            keywords_region=req.keywords_region,
            char_count=req.char_count
        )
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/reply")
def generate_reply(req: GenerateReplyRequest, current_user: models.User = Depends(auth.get_current_user)):
    try:
        client = ai_generator.AIClient()
        content = client.generate_review_reply(req.review_text, req.reviewer_name, req.star_rating, req.tone)
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeSentimentRequest(BaseModel):
    store_id: str

@router.post("/analyze/sentiment")
def analyze_sentiment(req: AnalyzeSentimentRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # 1. Fetch reviews for store
    # For MVP, just fetch last 50 reviews from DB
    reviews = db.query(models.Review).filter(models.Review.store_id == req.store_id).order_by(models.Review.create_time.desc()).limit(50).all()
    
    if not reviews:
        return {"summary": "レビューが見つかりません", "score": 0}
        
    review_data = [{"text": r.comment, "rating": r.star_rating} for r in reviews if r.comment]

    client = ai_generator.AIClient()
    result = client.analyze_sentiment(review_data)
    
    # Future: Save result to Store model or separate InsightAnalysis model
    return result

# --- Prompt Management Removed ---
