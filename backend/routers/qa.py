from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(
    prefix="/qa",
    tags=["qa"],
)

class AnswerCreate(BaseModel):
    text: str

@router.get("/")
def list_questions(store_id: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Question)
    if store_id:
        query = query.filter(models.Question.store_id == store_id)
    return query.order_by(models.Question.update_time.desc()).all()

@router.get("/sync/{store_id}")
def sync_qa_from_google(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store or not store.google_location_id:
        raise HTTPException(status_code=400, detail="Store not linked")
    
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()
    
    client = google_api.GBPClient(connection.access_token)
    try:
        # 1. Sync Questions
        questions_resp = client.list_questions(store.google_location_id)
        synced_q_count = 0
        
        for q_data in questions_resp.get("questions", []):
            q_google_id = q_data.get("name", "").split("/")[-1]
            existing_q = db.query(models.Question).filter(models.Question.google_question_id == q_google_id).first()
            
            # Helper to parse time
            def parse_time(t_str):
                if not t_str: return datetime.utcnow()
                try: return datetime.fromisoformat(t_str.replace("Z", "+00:00"))
                except: return datetime.utcnow()

            create_time = parse_time(q_data.get("createTime"))
            update_time = parse_time(q_data.get("updateTime"))
            
            if not existing_q:
                existing_q = models.Question(
                    store_id=store_id,
                    google_question_id=q_google_id,
                    authore_name=q_data.get("author", {}).get("displayName", "Anonymous"),
                    text=q_data.get("text"),
                    upvote_count=q_data.get("upvoteCount", 0),
                    create_time=create_time,
                    update_time=update_time
                )
                db.add(existing_q)
                synced_q_count += 1
            else:
                existing_q.update_time = update_time
                existing_q.upvote_count = q_data.get("upvoteCount", 0)
            
            db.commit() # Commit to get ID for answers
            db.refresh(existing_q) 
            
            # 2. Sync Answers for this Question
            # Note: This might be slow if many questions. Good for MVP.
            try:
                answers_resp = client.list_answers(q_data.get("name"))
                for a_data in answers_resp.get("answers", []):
                    a_google_id = a_data.get("name", "").split("/")[-1]
                    existing_a = db.query(models.Answer).filter(models.Answer.google_answer_id == a_google_id).first()
                    
                    a_create_time = parse_time(a_data.get("createTime"))
                    a_update_time = parse_time(a_data.get("updateTime"))
                    
                    if not existing_a:
                        new_a = models.Answer(
                            question_id=existing_q.id,
                            google_answer_id=a_google_id,
                            author_name=a_data.get("author", {}).get("displayName", "Anonymous"),
                            text=a_data.get("text"),
                            upvote_count=a_data.get("upvoteCount", 0),
                            author_type=a_data.get("author", {}).get("type", "REGULAR_USER"),
                            create_time=a_create_time,
                            update_time=a_update_time
                        )
                        db.add(new_a)
            except:
                pass # Ignore answer sync errors for individual questions
                
        db.commit()
        return {"message": f"Synced {synced_q_count} new questions"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{question_id}/answer")
def create_answer(
    question_id: str, 
    answer: AnswerCreate,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    store = db.query(models.Store).filter(models.Store.id == question.store_id).first()
    if not store or not store.google_location_id:
        raise HTTPException(status_code=400, detail="Store not linked")

    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")

    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()

    client = google_api.GBPClient(connection.access_token)
    try:
        # Question name: accounts/.../locations/.../questions/{id}
        question_name = f"{store.google_location_id}/questions/{question.google_question_id}"
        result = client.create_answer(question_name, answer.text)
        
        # Save local
        google_id = result.get("name", "").split("/")[-1]
        new_answer = models.Answer(
            question_id=question.id,
            google_answer_id=google_id,
            author_name=result.get("author", {}).get("displayName", "Owner"),
            text=answer.text,
            author_type="MERCHANT",
            create_time=datetime.utcnow()
        )
        db.add(new_answer)
        db.commit()
        return new_answer
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
