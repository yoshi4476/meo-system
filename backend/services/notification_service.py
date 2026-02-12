from sqlalchemy.orm import Session
import models
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    async def send_email(self, user_id: str, subject: str, message: str):
        """
        Send an email to a user.
        Currently MOCKS the sending process by logging to console and DB.
        """
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            logger.error(f"Notification failed: User {user_id} not found")
            return False

        # 1. Create Log Entry (PENDING)
        log = models.NotificationLog(
            user_id=user_id,
            type="EMAIL",
            subject=subject,
            message=message,
            status="PENDING"
        )
        self.db.add(log)
        self.db.commit()
        
        try:
            # 2. Simulate Sending (SMTP integration would go here)
            print(f"--- [MOCK EMAIL] To: {user.email} ---")
            print(f"Subject: {subject}")
            print(f"Body: {message}")
            print("--------------------------------------")
            
            # 3. Update Log to SENT
            log.status = "SENT"
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            log.status = "FAILED"
            self.db.commit()
            return False

    async def send_system_alert(self, user_id: str, message: str):
        return await self.send_email(user_id, "【MEO Mastermind】システム通知", message)
