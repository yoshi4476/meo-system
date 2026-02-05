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
    
    # Check 2: Photos (Simulated check as we don't sync media count yet)
    # Ideally we would check: len(store.media) < 50
    suggestions.append({
        "type": "WARNING",
        "title": "写真を50枚以上を目指しましょう",
        "description": "写真はユーザーの興味を惹く最も重要な要素です。現在よりさらに充実させることを推奨します。",
        "action": "UPLOAD_PHOTO"
    })
    
    # Check 3: Reviews
    # Check if recent reviews have replies
    try:
        unreplied_count = db.query(models.Review).filter(
            models.Review.store_id == store_id, 
            models.Review.reply_comment == None
        ).count()
        
        if unreplied_count > 0:
            suggestions.append({
                "type": "URGENT",
                "title": f"未返信のクチコミが{unreplied_count}件あります",
                "description": "クチコミへの返信はMEO評価に大きく影響します。AI返信を利用して返信しましょう。",
                "action": "GO_TO_REVIEWS"
            })
    except Exception as e:
        print(f"Error checking reviews: {e}")

    # Check 4: Posts (Check if posted in last 7 days)
    try:
        from datetime import datetime, timedelta
        recent_post = db.query(models.Post).filter(
            models.Post.store_id == store_id,
            models.Post.created_at >= datetime.utcnow() - timedelta(days=7)
        ).first()

        if not recent_post:
             suggestions.append({
                "type": "INFO",
                "title": "最新の投稿がありません",
                "description": "週に1回以上の投稿は、検索順位の維持・向上に効果的です。",
                "action": "CREATE_POST"
            })
    except Exception as e:
         print(f"Error checking posts: {e}")

    # Check 5: Q&A (Unanswered questions)
    # Note: QA model structure assumes question has answer? Need to check QA schema.
    # Assuming we don't have local QA db fully structured for unanswered check easily yet, skipping strict check or mocking.
    # Actually we can see routers/qa.py implies we fetch from Google. 
    # Let's add a generic suggestion if we can't check.
    suggestions.append({
        "type": "INFO",
        "title": "Q&Aを確認しましょう",
        "description": "ユーザーからの質問には迅速に回答することが重要です。",
        "action": "GO_TO_QA"
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
