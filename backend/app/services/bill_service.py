from sqlalchemy.orm import Session
from app.models.bill import Bill
from datetime import date, timedelta
from typing import List, Dict, Optional

class BillService:
    
    @staticmethod
    def update_bill_statuses(db: Session, user_id: int) -> int:
        """
        Automatically update bill status based on due date.
        - If due_date < today and status != 'paid' → set to 'overdue'
        - If due_date >= today and status == 'overdue' → set to 'upcoming'
        
        Returns number of bills updated.
        """
        today = date.today()
        updated_count = 0
        
        # Get all unpaid bills for user
        bills = db.query(Bill).filter(
            Bill.user_id == user_id,
            Bill.status != "paid"
        ).all()
        
        for bill in bills:
            old_status = bill.status
            
            # If past due date and not paid → overdue
            if bill.due_date < today and bill.status != "overdue":
                bill.status = "overdue"
                updated_count += 1
            
            # If future due date and currently overdue → upcoming
            elif bill.due_date >= today and bill.status == "overdue":
                bill.status = "upcoming"
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
        
        return updated_count
    
    @staticmethod
    def get_bills_with_metadata(db: Session, user_id: int) -> List[Dict]:
        """
        Get all bills for user with calculated metadata (days_until_due).
        Automatically updates statuses before returning.
        """
        # Update statuses first
        BillService.update_bill_statuses(db, user_id)
        
        # Fetch bills
        bills = db.query(Bill).filter(Bill.user_id == user_id).order_by(Bill.due_date.asc()).all()
        
        today = date.today()
        result = []
        
        for bill in bills:
            days_until_due = (bill.due_date - today).days
            
            bill_dict = {
                "id": bill.id,
                "user_id": bill.user_id,
                "biller_name": bill.biller_name,
                "due_date": bill.due_date,
                "amount_due": bill.amount_due,
                "status": bill.status,
                "auto_pay": bill.auto_pay,
                "created_at": bill.created_at,
                "days_until_due": days_until_due,
                "reminder_sent": bill.reminder_sent,
                "reminder_sent_at": bill.reminder_sent_at,
                "reminder_count": bill.reminder_count
            }
            result.append(bill_dict)
        
        return result
    
    @staticmethod
    def get_upcoming_bills(db: Session, user_id: int, days: int = 7) -> List[Bill]:
        """
        Get bills due in next N days (default 7).
        Used for reminders.
        """
        today = date.today()
        future_date = today + timedelta(days=days)
        
        bills = db.query(Bill).filter(
            Bill.user_id == user_id,
            Bill.status == "upcoming",
            Bill.due_date >= today,
            Bill.due_date <= future_date
        ).all()
        
        return bills
    
    @staticmethod
    def get_overdue_bills(db: Session, user_id: int) -> List[Bill]:
        """
        Get all overdue bills for user.
        """
        bills = db.query(Bill).filter(
            Bill.user_id == user_id,
            Bill.status == "overdue"
        ).all()
        
        return bills
    
    @staticmethod
    def mark_as_paid(db: Session, bill_id: int, user_id: int) -> Optional[Bill]:
        """
        Mark a bill as paid.
        Returns the updated bill if successful, None if bill not found or unauthorized.
        """
        bill = db.query(Bill).filter(
            Bill.id == bill_id,
            Bill.user_id == user_id
        ).first()
        
        if not bill:
            return None
        
        bill.status = "paid"
        db.commit()
        db.refresh(bill)
        return bill