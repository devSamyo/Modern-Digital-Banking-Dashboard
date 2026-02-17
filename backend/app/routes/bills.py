from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.bill import Bill
from app.schemas.bill import BillCreate, BillUpdate, BillOut
from app.services.bill_service import BillService
from app.services.bill_reminder_service import BillReminderService

router = APIRouter(prefix="/bills", tags=["Bills"])

@router.post("/", response_model=BillOut, status_code=status.HTTP_201_CREATED)
def create_bill(
    bill: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new bill for the logged-in user.
    Status is automatically set based on due date.
    """
    # Determine initial status
    today = date.today()
    initial_status = "upcoming" if bill.due_date >= today else "overdue"
    
    new_bill = Bill(
        user_id=current_user.id,
        biller_name=bill.biller_name,
        due_date=bill.due_date,
        amount_due=bill.amount_due,
        auto_pay=bill.auto_pay,
        status=initial_status
    )
    
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    
    # Add days_until_due
    days_until_due = (new_bill.due_date - today).days
    
    return {
        **new_bill.__dict__,
        "days_until_due": days_until_due
    }

@router.get("/", response_model=List[BillOut])
def get_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all bills for the logged-in user.
    Automatically updates bill statuses before returning.
    """
    bills = BillService.get_bills_with_metadata(db, current_user.id)
    return bills

@router.get("/{bill_id}", response_model=BillOut)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific bill.
    Validates that users can access only their own bills.
    """
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Bill not found or not authorized"
        )
    
    today = date.today()
    days_until_due = (bill.due_date - today).days
    
    return {
        **bill.__dict__,
        "days_until_due": days_until_due
    }

@router.put("/{bill_id}", response_model=BillOut)
def update_bill(
    bill_id: int,
    bill_update: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a bill.
    Validates that users can update only their own bills.
    """
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Bill not found or not authorized"
        )
    
    # Update fields
    if bill_update.biller_name is not None:
        bill.biller_name = bill_update.biller_name
    if bill_update.due_date is not None:
        bill.due_date = bill_update.due_date
    if bill_update.amount_due is not None:
        bill.amount_due = bill_update.amount_due
    if bill_update.status is not None:
        bill.status = bill_update.status
    if bill_update.auto_pay is not None:
        bill.auto_pay = bill_update.auto_pay
    
    db.commit()
    db.refresh(bill)
    
    today = date.today()
    days_until_due = (bill.due_date - today).days
    
    return {
        **bill.__dict__,
        "days_until_due": days_until_due
    }

@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a bill.
    Validates that users can delete only their own bills.
    """
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Bill not found or not authorized"
        )
    
    db.delete(bill)
    db.commit()
    
    return None

@router.post("/{bill_id}/mark-paid", response_model=BillOut)
def mark_bill_as_paid(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a bill as paid.
    """
    # Get bill first
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Bill not found or not authorized"
        )
    
    # Mark as paid
    bill.status = "paid"
    db.commit()
    db.refresh(bill)
    
    today = date.today()
    days_until_due = (bill.due_date - today).days
    
    return {
        **bill.__dict__,
        "days_until_due": days_until_due
    }

@router.get("/upcoming/summary")
def get_upcoming_bills_summary(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get summary of bills due in next N days (default 7).
    """
    upcoming = BillService.get_upcoming_bills(db, current_user.id, days)
    overdue = BillService.get_overdue_bills(db, current_user.id)
    
    total_upcoming_amount = sum(bill.amount_due for bill in upcoming)
    total_overdue_amount = sum(bill.amount_due for bill in overdue)
    
    return {
        "upcoming_count": len(upcoming),
        "upcoming_amount": total_upcoming_amount,
        "overdue_count": len(overdue),
        "overdue_amount": total_overdue_amount,
        "upcoming_bills": [
            {
                "id": bill.id,
                "biller_name": bill.biller_name,
                "due_date": bill.due_date,
                "amount_due": bill.amount_due,
                "days_until_due": (bill.due_date - date.today()).days
            }
            for bill in upcoming
        ],
        "overdue_bills": [
            {
                "id": bill.id,
                "biller_name": bill.biller_name,
                "due_date": bill.due_date,
                "amount_due": bill.amount_due,
                "days_overdue": (date.today() - bill.due_date).days
            }
            for bill in overdue
        ]
    }

@router.post("/send-reminders")
def trigger_bill_reminders(
    days_ahead: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger bill reminder check (for testing).
    In production, this runs automatically via Celery.
    """
    result = BillReminderService.send_reminders(db, days_ahead=days_ahead)
    return {
        "message": "Bill reminders processed",
        "result": result
    }