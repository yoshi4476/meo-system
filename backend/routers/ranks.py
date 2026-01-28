from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random # For simulation

router = APIRouter(
    prefix="/ranks",
    tags=["ranks"],
)

class KeywordCreate(BaseModel):
    text: str
    location: str

class KeywordResponse(BaseModel):
    id: str
    text: str
    location: str
    current_rank: Optional[int]
    prev_rank: Optional[int]

    class Config:
        orm_mode = True

@router.get("/")
def list_keywords(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    keywords = db.query(models.Keyword).filter(models.Keyword.store_id == store_id).all()
    res = []
    for k in keywords:
        # Get latest rank
        latest = db.query(models.RankResult).filter(models.RankResult.keyword_id == k.id).order_by(models.RankResult.check_date.desc()).first()
        prev = db.query(models.RankResult).filter(models.RankResult.keyword_id == k.id).order_by(models.RankResult.check_date.desc()).offset(1).first()
        
        res.append({
            "id": k.id,
            "text": k.text,
            "location": k.location,
            "current_rank": latest.rank if latest else None,
            "prev_rank": prev.rank if prev else None
        })
    return res

@router.post("/")
def add_keyword(store_id: str, kw: KeywordCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_kw = models.Keyword(
        store_id=store_id,
        text=kw.text,
        location=kw.location
    )
    db.add(new_kw)
    db.commit()
    db.refresh(new_kw)
    # Trigger initial check (simulation)
    check_rank_simulation(new_kw.id, db)
    return new_kw

@router.delete("/{keyword_id}")
def delete_keyword(keyword_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    kw = db.query(models.Keyword).filter(models.Keyword.id == keyword_id).first()
    if kw:
        db.delete(kw)
        db.commit()
    return {"message": "Deleted"}

@router.post("/check/{store_id}")
def check_ranks(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Run check for all keywords in store
    keywords = db.query(models.Keyword).filter(models.Keyword.store_id == store_id).all()
    count = 0
    for k in keywords:
        check_rank_simulation(k.id, db)
        count += 1
    return {"message": f"Checked {count} keywords"}

def check_rank_simulation(keyword_id: str, db: Session):
    # SIMULATION: Generate random rank between 1 and 20, or unranked
    # In production, this would call SerpApi or comparable
    import random
    rank = random.randint(1, 15)
    
    # Add some noise to make it look realistic (stay close to previous rank)
    prev = db.query(models.RankResult).filter(models.RankResult.keyword_id == keyword_id).order_by(models.RankResult.check_date.desc()).first()
    if prev and prev.rank:
        change = random.randint(-2, 2)
        rank = max(1, min(20, prev.rank + change))
        
    result = models.RankResult(
        keyword_id=keyword_id,
        rank=rank,
        check_date=datetime.utcnow()
    )
    db.add(result)
    db.commit()

@router.get("/history/{keyword_id}")
def get_rank_history(keyword_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    history = db.query(models.RankResult).filter(models.RankResult.keyword_id == keyword_id).order_by(models.RankResult.check_date.asc()).all()
    return history
