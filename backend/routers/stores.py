from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, auth, database

router = APIRouter(
    prefix="/admin/stores",
    tags=["admin-stores"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Store])
def list_stores(
    skip: int = 0, 
    limit: int = 100, 
    company_id: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    List stores. 
    SUPER_ADMIN: Can see all, or filter by company_id.
    COMPANY_ADMIN: Can only see their own company's stores (company_id param ignored/overridden).
    STORE_USER: Can only see their assigned store.
    """
    query = db.query(models.Store)

    if current_user.role == 'SUPER_ADMIN':
        if company_id:
            query = query.filter(models.Store.company_id == company_id)
    elif current_user.role == 'COMPANY_ADMIN':
        if not current_user.company_id:
             return [] # Should not happen for restricted users
        query = query.filter(models.Store.company_id == current_user.company_id)
    elif current_user.role == 'STORE_USER':
         if not current_user.store_id:
             return []
         query = query.filter(models.Store.id == current_user.store_id)
    else:
        # Fallback for old users or safety
        return []

    stores = query.offset(skip).limit(limit).all()
    return stores

@router.post("/", response_model=schemas.Store)
def create_store(
    store: schemas.StoreCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_company_admin)
):
    """
    Create a new store.
    SUPER_ADMIN: Can create for any company.
    COMPANY_ADMIN: Can create for their own company only.
    """
    
    target_company_id = store.company_id

    if current_user.role == 'COMPANY_ADMIN':
        if target_company_id and target_company_id != current_user.company_id:
             raise HTTPException(status_code=403, detail="Cannot create store for another company")
        target_company_id = current_user.company_id
    
    if not target_company_id:
         raise HTTPException(status_code=400, detail="Company ID is required")

    # Check for duplicates? Name might not be unique globally, but maybe within company?
    # For now, allow duplicates or check if needed.
    
    new_store = models.Store(
        name=store.name,
        company_id=target_company_id,
        google_location_id=store.google_location_id
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    return new_store

@router.delete("/{store_id}")
def delete_store(
    store_id: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_company_admin)
):
    start_query = db.query(models.Store).filter(models.Store.id == store_id)
    
    if current_user.role == 'COMPANY_ADMIN':
        start_query = start_query.filter(models.Store.company_id == current_user.company_id)
        
    db_store = start_query.first()
    if db_store is None:
        raise HTTPException(status_code=404, detail="Store not found or permission denied")
    
    db.delete(db_store)
    db.commit()
    return {"message": "Store deleted successfully"}
