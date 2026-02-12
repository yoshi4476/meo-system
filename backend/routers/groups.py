from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, models, auth, schemas
from typing import List

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)

@router.get("/", response_model=List[schemas.StoreGroup])
def list_groups(
    company_id: str = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_company_admin)
):
    """
    List store groups.
    If SUPER_ADMIN, can filter by company_id.
    If COMPANY_ADMIN, only sees their own groups.
    """
    query = db.query(models.StoreGroup)
    
    if current_user.role == "SUPER_ADMIN":
        if company_id:
            query = query.filter(models.StoreGroup.company_id == company_id)
    else:
        # COMPANY_ADMIN
        query = query.filter(models.StoreGroup.company_id == current_user.company_id)
        
    return query.all()

@router.post("/", response_model=schemas.StoreGroup)
def create_group(
    group: schemas.StoreGroupCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_company_admin)
):
    target_company_id = current_user.company_id
    if current_user.role == "SUPER_ADMIN":
        # In a real app, super admin would specify company_id in body, 
        # but for simplicity we assume current context or extended schema.
        # Here we just use current_user's company if set, or error if not provided in a fuller schema.
        # For MVP, let's assume Super Admin creates for their own "Agency" group or needs extra param.
        # Let's fallback to current_user.company_id
        if not target_company_id:
             raise HTTPException(status_code=400, detail="Super Admin must belong to a company or specify company_id")
    
    new_group = models.StoreGroup(
        company_id=target_company_id,
        name=group.name,
        description=group.description
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.put("/{group_id}/stores/{store_id}")
def add_store_to_group(
    group_id: str,
    store_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_company_admin)
):
    # Verify ownership
    group = db.query(models.StoreGroup).filter(models.StoreGroup.id == group_id).first()
    if not group:
         raise HTTPException(status_code=404, detail="Group not found")
         
    if current_user.role != "SUPER_ADMIN" and group.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    store.group_id = group_id
    db.commit()
    return {"message": f"Store {store.name} added to group {group.name}"}
