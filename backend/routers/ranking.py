from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from models import User, RankLog, Keyword, Store
import models, schemas, database
from context import get_current_user
from services.ranking_service import RankingService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/ranking",
    tags=["ranking"],
    responses={404: {"description": "Not found"}},
)

# Pydantic Schemas for this router (can move to schemas.py later if needed)
class KeywordCreate(BaseModel):
    text: str
    location: Optional[str] = None

class RankLogSchema(BaseModel):
    id: str
    date: datetime
    rank: int
    url: Optional[str] = None
    class Config:
        from_attributes = True

class KeywordSchema(BaseModel):
    id: str
    text: str
    location: Optional[str]
    created_at: datetime
    current_rank: Optional[int] = None
    rank_logs: List[RankLogSchema] = []
    class Config:
        from_attributes = True

@router.get("/keywords", response_model=List[KeywordSchema])
def get_keywords(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.store_id:
        raise HTTPException(status_code=400, detail="Store not selected")
    
    service = RankingService(db)
    keywords = service.get_keywords(current_user.store_id)
    
    # Enrich with current rank (last log)
    result = []
    for k in keywords:
        k_schema = KeywordSchema.model_validate(k)
        # Fetch last log for current rank
        last_log = db.query(models.RankLog).filter(
            models.RankLog.keyword_id == k.id
        ).order_by(models.RankLog.date.desc()).first()
        
        if last_log:
            k_schema.current_rank = last_log.rank
        
        result.append(k_schema)
        
    return result

@router.post("/keywords", response_model=KeywordSchema)
def add_keyword(
    keyword: KeywordCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.store_id:
        raise HTTPException(status_code=400, detail="Store not selected")
        
    service = RankingService(db)
    new_keyword = service.add_keyword(current_user.store_id, keyword.text, keyword.location)
    
    # Refresh to get ID and stuff
    return KeywordSchema.model_validate(new_keyword)

@router.delete("/keywords/{keyword_id}")
def delete_keyword(
    keyword_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify ownership
    keyword = db.query(models.Keyword).filter(models.Keyword.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    
    if keyword.store_id != current_user.store_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(keyword)
    db.commit()
    return {"status": "success"}

@router.post("/keywords/{keyword_id}/check")
def check_ranking(
    keyword_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    service = RankingService(db)
    log = service.check_ranking(keyword_id)
    if not log:
         raise HTTPException(status_code=404, detail="Keyword not found")
    return RankLogSchema.model_validate(log)

@router.get("/keywords/{keyword_id}/history", response_model=List[RankLogSchema])
def get_history(
    keyword_id: str,
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    service = RankingService(db)
    logs = service.get_history(keyword_id, days)
    return [RankLogSchema.model_validate(log) for log in logs]
