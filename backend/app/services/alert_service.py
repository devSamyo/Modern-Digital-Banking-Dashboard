from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.alert import Alert
from app.models.account import Account
from app.models.bill import Bill
from app.models.budget import Budget
from app.models.transaction import Transaction
from datetime import datetime, timedelta
from typing import List, Dict
from decimal import Decimal
from sqlalchemy import func, extract
import logging

logger = logging.getLogger(__name__)


class AlertService:
    """Service for generating and managing alerts."""
    
    # Alert thresholds
    LOW_BALANCE_THRESHOLD = Decimal('1000.00')  # Alert if balance below ₹1000
    
    @staticmethod
    def generate_low_balance_alerts(db: Session) -> int:
        """
        Generate alerts for accounts with low balance.
        
        Returns:
            Number of alerts created
        """
        alerts_created = 0
        
        # Find accounts with low balance
        low_balance_accounts = db.query(Account).filter(
            Account.balance < AlertService.LOW_BALANCE_THRESHOLD
        ).all()
        
        for account in low_balance_accounts:
            # Check if alert already exists (avoid duplicates)
            existing_alert = db.query(Alert).filter(
                and_(
                    Alert.user_id == account.user_id,
                    Alert.alert_type == 'low_balance',
                    Alert.related_id == account.id,
                    Alert.read_status == False
                )
            ).first()
            
            if not existing_alert:
                # Create new alert
                alert = Alert(
                    user_id=account.user_id,
                    alert_type='low_balance',
                    message=f"⚠️ Low balance alert: {account.bank_name} account has only ₹{account.balance} remaining.",
                    related_id=account.id
                )
                db.add(alert)
                alerts_created += 1
                logger.info(f"✅ Low balance alert created for account {account.id}")
        
        db.commit()
        return alerts_created
    
    @staticmethod
    def generate_bill_due_alerts(db: Session, days_ahead: int = 3) -> int:
        """
        Generate alerts for upcoming or overdue bills.
        
        Args:
            days_ahead: Alert for bills due in next N days
        
        Returns:
            Number of alerts created
        """
        alerts_created = 0
        today = datetime.now().date()
        future_date = today + timedelta(days=days_ahead)
        
        # Find upcoming bills (not paid)
        upcoming_bills = db.query(Bill).filter(
            and_(
                Bill.status.in_(['upcoming', 'overdue']),
                Bill.due_date <= future_date
            )
        ).all()
        
        for bill in upcoming_bills:
            # Check if alert already exists
            existing_alert = db.query(Alert).filter(
                and_(
                    Alert.user_id == bill.user_id,
                    Alert.alert_type == 'bill_due',
                    Alert.related_id == bill.id,
                    Alert.read_status == False
                )
            ).first()
            
            if not existing_alert:
                # Determine urgency
                days_until_due = (bill.due_date - today).days
                
                if days_until_due < 0:
                    urgency = "OVERDUE"
                    icon = "🚨"
                elif days_until_due == 0:
                    urgency = "DUE TODAY"
                    icon = "⏰"
                else:
                    urgency = f"due in {days_until_due} day{'s' if days_until_due > 1 else ''}"
                    icon = "📅"
                
                alert = Alert(
                    user_id=bill.user_id,
                    alert_type='bill_due',
                    message=f"{icon} Bill reminder: {bill.biller_name} payment of ₹{bill.amount_due} is {urgency}.",
                    related_id=bill.id
                )
                db.add(alert)
                alerts_created += 1
                logger.info(f"✅ Bill due alert created for bill {bill.id}")
        
        db.commit()
        return alerts_created
    
    @staticmethod
    def generate_budget_exceeded_alerts(db: Session) -> int:
        """
        Generate alerts for budgets that have been exceeded.
        
        Returns:
            Number of alerts created
        """
        alerts_created = 0
        
        # Get current month
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        # Find all budgets
        budgets = db.query(Budget).all()
        
        for budget in budgets:
            # Skip if not current month budget
            if budget.month != current_month or budget.year != current_year:
                continue
            
            # Get user's accounts
            account_ids = db.query(Account.id).filter(
                Account.user_id == budget.user_id
            ).all()
            account_ids = [acc[0] for acc in account_ids]
            
            if not account_ids:
                continue
            
            # Calculate actual spending for this category in current month
            actual_spending = db.query(func.sum(Transaction.amount)).filter(
                and_(
                    Transaction.account_id.in_(account_ids),
                    Transaction.category == budget.category,
                    Transaction.txn_type == 'debit',
                    extract('year', Transaction.txn_date) == current_year,
                    extract('month', Transaction.txn_date) == current_month
                )
            ).scalar() or Decimal('0.00')
            
            # Convert budget limit to Decimal for comparison
            budget_limit = Decimal(str(budget.limit_amount))
            
            # Check if exceeded
            if actual_spending > budget_limit:
                # Check if alert already exists
                existing_alert = db.query(Alert).filter(
                    and_(
                        Alert.user_id == budget.user_id,
                        Alert.alert_type == 'budget_exceeded',
                        Alert.related_id == budget.id,
                        Alert.read_status == False
                    )
                ).first()
                
                if not existing_alert:
                    overspend_amount = actual_spending - budget_limit
                    overspend_percent = (overspend_amount / budget_limit * 100) if budget_limit > 0 else 0
                    
                    alert = Alert(
                        user_id=budget.user_id,
                        alert_type='budget_exceeded',
                        message=f"💸 Budget exceeded: You've spent ₹{actual_spending:.2f} on {budget.category}, exceeding your budget of ₹{budget_limit:.2f} by {overspend_percent:.1f}%.",
                        related_id=budget.id
                    )
                    db.add(alert)
                    alerts_created += 1
                    logger.info(f"✅ Budget exceeded alert created for budget {budget.id}")
        
        db.commit()
        return alerts_created
    
    @staticmethod
    def generate_all_alerts(db: Session) -> Dict[str, int]:
        """
        Generate all types of alerts.
        
        Returns:
            Dictionary with count of each alert type created
        """
        logger.info("=" * 80)
        logger.info("🔔 Generating alerts...")
        
        low_balance = AlertService.generate_low_balance_alerts(db)
        bill_due = AlertService.generate_bill_due_alerts(db)
        budget_exceeded = AlertService.generate_budget_exceeded_alerts(db)
        
        total = low_balance + bill_due + budget_exceeded
        
        logger.info(f"✅ Alerts generated: {total} total")
        logger.info(f"   - Low balance: {low_balance}")
        logger.info(f"   - Bill due: {bill_due}")
        logger.info(f"   - Budget exceeded: {budget_exceeded}")
        logger.info("=" * 80)
        
        return {
            'low_balance': low_balance,
            'bill_due': bill_due,
            'budget_exceeded': budget_exceeded,
            'total': total
        }
    
    @staticmethod
    def get_user_alerts(db: Session, user_id: int, unread_only: bool = False) -> List[Alert]:
        """
        Get alerts for a user.
        
        Args:
            db: Database session
            user_id: User ID
            unread_only: If True, return only unread alerts
        
        Returns:
            List of Alert objects
        """
        query = db.query(Alert).filter(Alert.user_id == user_id)
        
        if unread_only:
            query = query.filter(Alert.read_status == False)
        
        alerts = query.order_by(Alert.created_at.desc()).all()
        return alerts
    
    @staticmethod
    def mark_alert_as_read(db: Session, alert_id: int, user_id: int) -> bool:
        """
        Mark an alert as read.
        
        Args:
            db: Database session
            alert_id: Alert ID
            user_id: User ID (for validation)
        
        Returns:
            True if successful, False otherwise
        """
        alert = db.query(Alert).filter(
            and_(
                Alert.id == alert_id,
                Alert.user_id == user_id
            )
        ).first()
        
        if not alert:
            return False
        
        alert.read_status = True
        db.commit()
        logger.info(f"✅ Alert {alert_id} marked as read")
        return True
    
    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """
        Mark all alerts as read for a user.
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            Number of alerts marked as read
        """
        count = db.query(Alert).filter(
            and_(
                Alert.user_id == user_id,
                Alert.read_status == False
            )
        ).update({'read_status': True})
        
        db.commit()
        logger.info(f"✅ Marked {count} alerts as read for user {user_id}")
        return count