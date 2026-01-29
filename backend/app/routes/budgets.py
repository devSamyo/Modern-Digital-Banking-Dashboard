from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut, BudgetWithSpending
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("/", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new budget for the logged-in user.
    Prevents duplicate budgets for same category + month + year.
    """
    new_budget = Budget(
        user_id=current_user.id,
        category=budget.category,
        month=budget.month,
        year=budget.year,
        limit_amount=budget.limit_amount
    )
    
    try:
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        return new_budget
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Budget already exists for {budget.category} in {budget.month}/{budget.year}"
        )

@router.get("/", response_model=List[BudgetOut])
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all budgets for the logged-in user.
    Optionally filter by month and year.
    """
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    
    if month:
        query = query.filter(Budget.month == month)
    if year:
        query = query.filter(Budget.year == year)
    
    budgets = query.order_by(Budget.year.desc(), Budget.month.desc()).all()
    return budgets

@router.get("/with-spending", response_model=List[BudgetWithSpending])
def get_budgets_with_spending(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all budgets with dynamically calculated spending.
    Returns budget limit, spent amount (calculated), remaining, over-budget flag.
    spent_amount is calculated in real-time from transactions.
    """
    # Default to current month/year if not provided
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    budgets_with_spending = BudgetService.get_all_budgets_with_spending(
        db=db,
        user_id=current_user.id,
        month=month,
        year=year
    )
    
    return budgets_with_spending

@router.get("/{budget_id}", response_model=BudgetOut)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific budget.
    Validates that users can access only their own budgets.
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found or not authorized"
        )
    
    return budget

@router.get("/{budget_id}/with-spending", response_model=BudgetWithSpending)
def get_budget_with_spending(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific budget with dynamically calculated spending information.
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found or not authorized"
        )
    
    return BudgetService.get_budget_with_spending(db, budget)

@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a budget limit.
    Validates that users can update only their own budgets.
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found or not authorized"
        )
    
    if budget_update.limit_amount is not None:
        budget.limit_amount = budget_update.limit_amount
    
    db.commit()
    db.refresh(budget)
    
    return budget

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a budget.
    Validates that users can delete only their own budgets.
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found or not authorized"
        )
    
    db.delete(budget)
    db.commit()
    
    return None