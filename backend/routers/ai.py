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
def generate_post(
    req: GeneratePostRequest, 
    current_user: models.User = Depends(auth.get_current_user),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key")
):
    try:
        client = ai_generator.AIClient(api_key=x_gemini_api_key)
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

@router.get("/prompts")
def list_prompts(category: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Prompt).filter(models.Prompt.user_id == current_user.id)
    if category:
        query = query.filter(models.Prompt.category == category)
    return query.all()

@router.post("/prompts")
def create_or_update_prompt(prompt: PromptCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check for existing prompt for this user & category
    # For now, we assume 1 prompt per category per user for simplicity as per requirements (Global Reply Prompt, Locked Post Prompt)
    existing = db.query(models.Prompt).filter(
        models.Prompt.user_id == current_user.id,
        models.Prompt.category == prompt.category
    ).first()
    
    if existing:
        existing.title = prompt.title
        existing.content = prompt.content
        existing.is_locked = prompt.is_locked
        existing.update_time = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_prompt = models.Prompt(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            title=prompt.title,
            content=prompt.content,
            category=prompt.category,
            is_locked=prompt.is_locked,
            create_time=datetime.utcnow(),
            update_time=datetime.utcnow()
        )
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)
        return new_prompt

@router.post("/generate/reply")
def generate_reply(
    req: GenerateReplyRequest, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key")
):
    try:
        # Check for global prompt
        global_prompt = db.query(models.Prompt).filter(
            models.Prompt.user_id == current_user.id,
            models.Prompt.category == "REVIEW_REPLY"
        ).first()
        
        custom_instruction = global_prompt.content if global_prompt else None

        client = ai_generator.AIClient(api_key=x_gemini_api_key)
        content = client.generate_review_reply(
            review_text=req.review_text, 
            reviewer_name=req.reviewer_name, 
            star_rating=req.star_rating, 
            tone=req.tone,
            custom_instruction=custom_instruction
        )
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeSentimentRequest(BaseModel):
    store_id: str

@router.post("/analyze/sentiment")
def analyze_sentiment(
    req: AnalyzeSentimentRequest, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key")
):
    # 1. Fetch reviews for store
    # For MVP, just fetch last 50 reviews from DB
    reviews = db.query(models.Review).filter(models.Review.store_id == req.store_id).order_by(models.Review.create_time.desc()).limit(50).all()
    
    if not reviews:
        return {"summary": "レビューが見つかりません", "score": 0}
        
    review_data = [{"text": r.comment, "rating": r.star_rating} for r in reviews if r.comment]

    client = ai_generator.AIClient(api_key=x_gemini_api_key)
    result = client.analyze_sentiment(review_data)
    
    # Future: Save result to Store model or separate InsightAnalysis model
    return result

# --- Prompt Management Removed ---
