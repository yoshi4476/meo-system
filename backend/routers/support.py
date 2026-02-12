from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import database, models, schemas, auth
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/support",
    tags=["support"],
)

@router.post("/inquiry", response_model=schemas.Inquiry)
def create_inquiry(
    inquiry: schemas.InquiryCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Submit a user inquiry.
    """
    new_inquiry = models.Inquiry(
        user_id=current_user.id,
        category=inquiry.category,
        message=inquiry.message,
        status="PENDING"
    )
    db.add(new_inquiry)
    db.commit()
    db.refresh(new_inquiry)
    
    # Send notification to Admin (Mock/System Log for now)
    # In production, this would email the support team
    logger.info(f"New Inquiry from {current_user.email} [{inquiry.category}]: {inquiry.message}")
    
    # Also notify the user via internal notification
    from services.notification_service import NotificationService
    notification_service = NotificationService(db)
    background_tasks.add_task(
        notification_service.send_system_alert, 
        current_user.id, 
        f"お問い合わせを受け付けました。\n件名: {inquiry.category}"
    )

    return new_inquiry

@router.get("/inquiries", response_model=list[schemas.Inquiry])
def get_my_inquiries(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get current user's inquiry history.
    """
    return db.query(models.Inquiry).filter(models.Inquiry.user_id == current_user.id).order_by(models.Inquiry.created_at.desc()).all()
