from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api, ai_generator

router = APIRouter(
    prefix="/optimization",
    tags=["optimization"],
)

@router.get("/{store_id}")
def get_optimization_suggestions(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get AI-driven optimization suggestions for the business profile.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # In a real scenario, we would switch on connection status
    # For now, we simulate or use AI if available to analyze store data
    
    suggestions = []
    
    # Check 1: Description
    if not store.description or len(store.description) < 100:
        suggestions.append({
            "type": "WARNING",
            "title": "ビジネス説明が短すぎます",
            "description": "ビジネスの説明を充実させることで、検索順位が向上する可能性があります。AI生成を試してみてください。",
            "action": "AI_GENERATE_DESCRIPTION"
        })
    
    # Check 2: Photos (Mock check)
    # We would check media count here
    suggestions.append({
        "type": "INFO",
        "title": "写真をさらに追加しましょう",
        "description": "外観や内観の写真を増やすと、ユーザーの関心が高まります。",
        "action": "UPLOAD_PHOTO"
    })
    
    # Check 3: Reviews
    # Check if recent reviews have replies
    unreplied_count = db.query(models.Review).filter(
        models.Review.store_id == store_id, 
        models.Review.reply == None
    ).count()
    
    if unreplied_count > 0:
        suggestions.append({
            "type": "URGENT",
            "title": f"未返信のクチコミが{unreplied_count}件あります",
            "description": "クチコミへの返信はMEO評価に大きく影響します。AI返信を利用して返信しましょう。",
            "action": "GO_TO_REVIEWS"
        })

    # Calculate dynamic score based on completeness
    base_score = 100
    
    # Deduct points per suggestion type
    for s in suggestions:
        if s["type"] == "URGENT":
            base_score -= 15
        elif s["type"] == "WARNING":
            base_score -= 10
        else:  # INFO
            base_score -= 5
    
    # Ensure minimum score of 20
    final_score = max(20, base_score)

    return {
        "store_name": store.name,
        "score": final_score,
        "suggestions": suggestions
    }

@router.post("/{store_id}/generate")
def generate_optimization_content(store_id: str, type: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Generate optimized content using AI
    type: DESCRIPTION, POST_IDEA, etc.
    """
    client = ai_generator.AIClient()
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    
    if type == "DESCRIPTION":
        # Generate description
        prompt = f"ビジネス名: {store.name}\n業種: {store.category or '未設定'}\n\nこのビジネスの魅力を伝える、SEOに強いビジネス説明文を300文字程度で作成してください。"
        content = client.generate_text("あなたはMEOのプロフェッショナルです。", prompt)
        return {"content": content}
        
    return {"message": "Invalid type"}
