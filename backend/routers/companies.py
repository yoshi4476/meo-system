from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, auth, database

router = APIRouter(
    prefix="/admin/companies",
    tags=["admin-companies"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Company])
def list_companies(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """
    List all companies. Only accessible by SUPER_ADMIN.
    """
    companies = db.query(models.Company).offset(skip).limit(limit).all()
    return companies

@router.post("/", response_model=schemas.Company)
def create_company(
    company: schemas.CompanyCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    """
    Create a new company. Only accessible by SUPER_ADMIN.
    """
    db_company = db.query(models.Company).filter(models.Company.name == company.name).first()
    if db_company:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    new_company = models.Company(
        name=company.name,
        plan=company.plan
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company

@router.get("/{company_id}", response_model=schemas.Company)
def read_company(
    company_id: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    db_company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@router.delete("/{company_id}")
def delete_company(
    company_id: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    db_company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(db_company)
    db.commit()
    return {"message": "Company deleted successfully"}
