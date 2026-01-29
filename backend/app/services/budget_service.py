from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.account import Account
from typing import List, Dict, Optional
from decimal import Decimal

class BudgetService:
    
    @staticmethod
    def calculate_spending(
        db: Session,
        user_id: int,
        category: str,
        month: int,
        year: int
    ) -> float:
        """
        Dynamically calculate total spending for a category in a specific month/year.
        Sums debit transactions only.
        """
        # Get user's accounts
        user_accounts = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc.id for acc in user_accounts]
        
        if not account_ids:
            return 0.0
        
        # Sum debit transactions for the category in the specified month/year
        total_spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.category == category,
            Transaction.txn_type == "debit",
            extract('month', Transaction.txn_date) == month,
            extract('year', Transaction.txn_date) == year
        ).scalar()
        
        return float(total_spent) if total_spent else 0.0
    
    @staticmethod
    def get_budget_with_spending(
        db: Session,
        budget: Budget
    ) -> Dict:
        """
        Get budget details with dynamically calculated spending.
        Returns: budget limit, amount spent, remaining, over-budget flag.
        """
        # Dynamically calculate spent amount
        spent_amount = BudgetService.calculate_spending(
            db=db,
            user_id=budget.user_id,
            category=budget.category,
            month=budget.month,
            year=budget.year
        )
        
        remaining_amount = budget.limit_amount - spent_amount
        is_over_budget = spent_amount > budget.limit_amount
        percentage_used = (spent_amount / budget.limit_amount * 100) if budget.limit_amount > 0 else 0
        
        return {
            "id": budget.id,
            "user_id": budget.user_id,
            "category": budget.category,
            "month": budget.month,
            "year": budget.year,
            "limit_amount": budget.limit_amount,
            "spent_amount": round(spent_amount, 2),  # Dynamically calculated
            "remaining_amount": round(remaining_amount, 2),
            "is_over_budget": is_over_budget,
            "percentage_used": round(percentage_used, 2),
            "created_at": str(budget.created_at)
        }
    
    @staticmethod
    def get_all_budgets_with_spending(
        db: Session,
        user_id: int,
        month: Optional[int] = None,
        year: Optional[int] = None
    ) -> List[Dict]:
        """
        Get all budgets for a user with dynamically calculated spending.
        Optionally filter by month/year.
        """
        query = db.query(Budget).filter(Budget.user_id == user_id)
        
        if month:
            query = query.filter(Budget.month == month)
        if year:
            query = query.filter(Budget.year == year)
        
        budgets = query.all()
        
        return [
            BudgetService.get_budget_with_spending(db, budget)
            for budget in budgets
        ]