from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database, models, auth

router = APIRouter(
    prefix="/billing",
    tags=["billing"],
)

@router.get("/plan")
def get_current_plan(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_company_admin)
):
    """
    Get current subscription plan.
    """
    return {"plan": "BASIC", "status": "ACTIVE"}
