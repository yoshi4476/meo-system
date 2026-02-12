from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, models, auth, schemas
from typing import List
from services.notification_service import NotificationService

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)

@router.get("/", response_model=List[schemas.NotificationUserView])
def list_my_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get notification history for the current user.
    """
    return db.query(models.NotificationLog).filter(
        models.NotificationLog.user_id == current_user.id
    ).order_by(models.NotificationLog.created_at.desc()).limit(50).all()

@router.post("/test-email")
async def test_email(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Trigger a test email notification to yourself.
    """
    service = NotificationService(db)
    success = await service.send_email(
        user_id=current_user.id,
        subject="テスト送信",
        message="これはテスト通知です。\nシステムからのメール送信機能を確認しています。"
    )
    
    if success:
        return {"message": "Test email sent (Mock)"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")
