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
        content = client.generate_post_content(req.keywords, req.length_option, req.tone)
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

# --- Prompt Management ---

@router.get("/prompts")
def list_prompts(category: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Prompt).filter(
        (models.Prompt.user_id == current_user.id) | (models.Prompt.is_system == True)
    )
    if category:
        query = query.filter(models.Prompt.category == category)
    
    return query.order_by(models.Prompt.is_system.desc(), models.Prompt.create_time.desc()).all()

@router.post("/prompts")
def create_prompt(prompt: PromptCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check limit?
    new_prompt = models.Prompt(
        user_id=current_user.id,
        title=prompt.title,
        content=prompt.content,
        category=prompt.category,
        is_locked=prompt.is_locked
    )
    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)
    return new_prompt

@router.patch("/prompts/{prompt_id}")
def update_prompt(prompt_id: str, diff: PromptUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
        
    if prompt.is_system:
         raise HTTPException(status_code=403, detail="Cannot edit system prompts")
         
    if prompt.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your prompt")

    if diff.title is not None:
        prompt.title = diff.title
    if diff.content is not None:
        prompt.content = diff.content
    if diff.is_locked is not None:
        prompt.is_locked = diff.is_locked
        
    prompt.update_time = datetime.utcnow()
    db.commit()
    return prompt

@router.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt.is_system:
         raise HTTPException(status_code=403, detail="Cannot delete system prompts")
         
    if prompt.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your prompt")
        
    db.delete(prompt)
    db.commit()
    return {"message": "Prompt deleted"}
