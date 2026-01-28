from database import SessionLocal, engine
import models
import datetime

def seed_prompts():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    system_prompts = [
        {
            "title": "標準投稿生成",
            "content": "あなたはGoogleビジネスプロフィールの投稿作成のエキスパートです。親しみやすく、かつプロフェッショナルな口調で、集客効果の高い投稿文を作成してください。",
            "category": "POST_GENERATION"
        },
        {
            "title": "丁寧なクチコミ返信",
            "content": "あなたは店舗のオーナーです。お客様からのクチコミに感謝を示し、丁寧な敬語で返信してください。",
            "category": "REVIEW_REPLY"
        },
        {
            "title": "フレンドリーなクチコミ返信",
            "content": "あなたは親しみやすい店舗スタッフです。お客様との距離を縮めるような、明るくフレンドリーな返信を作成してください。",
            "category": "REVIEW_REPLY"
        }
    ]

    for p in system_prompts:
        existing = db.query(models.Prompt).filter(
            models.Prompt.is_system == True,
            models.Prompt.title == p["title"]
        ).first()
        
        if not existing:
            print(f"Adding system prompt: {p['title']}")
            new_prompt = models.Prompt(
                title=p["title"],
                content=p["content"],
                category=p["category"],
                is_system=True,
                is_locked=True
            )
            db.add(new_prompt)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_prompts()
