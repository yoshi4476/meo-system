from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database, models, auth
from typing import List

router = APIRouter(
    prefix="/ranking",
    tags=["ranking"],
)

@router.get("/")
def get_rankings(
    store_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get keyword rankings for a store.
    """
    # Authorization check needed here
    return {"message": "Rank tracking feature coming soon"}
