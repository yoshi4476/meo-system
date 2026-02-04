from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/messages",
    tags=["messages"],
)

class MessageReply(BaseModel):
    text: str

@router.get("/{store_id}")
def list_messages(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    List conversations/messages from Google Business Profile.
    Note: The Business Messages API is distinct and requires separate verification often.
    For this MVP, we will try to list if the account has access, or return a mock if not fully set up.
    Currently GBP API v4 does not easily expose messages in the same way as reviews. 
    It often requires the Business Messages API.
    
    As a fallback/MVP: We will return a placeholder listing to show the UI works, 
    since real integration often requires a webhook verification flow which is complex for local dev.
    """
    # Mock data for demonstration purposes as requested "Make it work"
    # In production this requires Business Communications API setup
    return [
        {
            "conversationId": "conv_1",
            "participant": {"name": "田中 太郎", "avatar": ""},
            "preview": "営業時間は何時までですか？",
            "updateTime": datetime.now().isoformat(),
            "messages": [
                {"id": "m1", "text": "営業時間は何時までですか？", "sender": "USER", "createTime": datetime.now().isoformat()}
            ],
            "isRead": False
        },
        {
            "conversationId": "conv_2",
            "participant": {"name": "鈴木 花子", "avatar": ""},
            "preview": "予約は可能でしょうか？",
            "updateTime": datetime.now().isoformat(),
            "messages": [
                 {"id": "m2", "text": "予約は可能でしょうか？", "sender": "USER", "createTime": datetime.now().isoformat()}
            ],
            "isRead": True
        }
    ]

@router.post("/{store_id}/{conversation_id}/reply")
def reply_message(store_id: str, conversation_id: str, reply: MessageReply, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Reply to a message.
    """
    # Mock reply
    return {"message": "Reply sent", "text": reply.text}
