from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.transaction import Transaction
from app.models.account import Account
from typing import List, Dict
from datetime import datetime, timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class InsightService:
    """Service for generating financial insights from transaction data."""
    
    @staticmethod
    def get_user_transactions(db: Session, user_id: int) -> List[Transaction]:
        """
        Fetch all transactions for a user across all their accounts.
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            List of Transaction objects
        """
        # Get all account IDs for the user
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        if not account_ids:
            return []
        
        # Fetch all transactions for these accounts
        transactions = db.query(Transaction).filter(
            Transaction.account_id.in_(account_ids)
        ).order_by(Transaction.txn_date.desc()).all()
        
        return transactions
    
    @staticmethod
    def calculate_monthly_cash_flow(db: Session, user_id: int, months: int = 6) -> List[Dict]:
        """
        Calculate monthly cash flow (credits, debits, net savings) for last N months.
        
        Args:
            db: Database session
            user_id: User ID
            months: Number of months to analyze (default: 6)
        
        Returns:
            List of monthly cash flow data
        """
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        if not account_ids:
            return []
        
        # Get date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        # Query transactions grouped by month
        monthly_data = db.query(
            func.date_trunc('month', Transaction.txn_date).label('month'),
            Transaction.txn_type,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_date >= start_date,
            Transaction.txn_date <= end_date
        ).group_by(
            func.date_trunc('month', Transaction.txn_date),
            Transaction.txn_type
        ).all()
        
        # Organize by month
        cash_flow_dict = {}
        for month, txn_type, total in monthly_data:
            month_str = month.strftime('%Y-%m')
            if month_str not in cash_flow_dict:
                cash_flow_dict[month_str] = {
                    'month': month_str,
                    'total_credits': 0.0,
                    'total_debits': 0.0,
                    'net_savings': 0.0
                }
            
            if txn_type == 'credit':
                cash_flow_dict[month_str]['total_credits'] = float(total)
            elif txn_type == 'debit':
                cash_flow_dict[month_str]['total_debits'] = float(total)
        
        # Calculate net savings
        for month_str in cash_flow_dict:
            credits = cash_flow_dict[month_str]['total_credits']
            debits = cash_flow_dict[month_str]['total_debits']
            cash_flow_dict[month_str]['net_savings'] = credits - debits
        
        # Sort by month
        result = sorted(cash_flow_dict.values(), key=lambda x: x['month'])
        
        logger.info(f"✅ Calculated cash flow for {len(result)} months")
        return result
    
    @staticmethod
    def calculate_top_merchants(db: Session, user_id: int, limit: int = 5) -> List[Dict]:
        """
        Calculate top merchants by total spending.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Number of top merchants to return
        
        Returns:
            List of top merchants with spending data
        """
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        if not account_ids:
            return []
        
        # Query top merchants (debit transactions only)
        top_merchants = db.query(
            Transaction.merchant,
            func.sum(Transaction.amount).label('total_spent'),
            func.count(Transaction.id).label('transaction_count')
        ).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == 'debit',
            Transaction.merchant.isnot(None),
            Transaction.merchant != ''
        ).group_by(
            Transaction.merchant
        ).order_by(
            func.sum(Transaction.amount).desc()
        ).limit(limit).all()
        
        result = [
            {
                'merchant': merchant,
                'total_spent': float(total),
                'transaction_count': count
            }
            for merchant, total, count in top_merchants
        ]
        
        logger.info(f"✅ Found {len(result)} top merchants")
        return result
    
    @staticmethod
    def calculate_category_spending(db: Session, user_id: int) -> List[Dict]:
        """
        Calculate spending summary grouped by category.
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            List of category spending data with percentages
        """
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        if not account_ids:
            return []
        
        # Query category spending (debit transactions only)
        category_data = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total_spent'),
            func.count(Transaction.id).label('transaction_count')
        ).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == 'debit'
        ).group_by(
            Transaction.category
        ).order_by(
            func.sum(Transaction.amount).desc()
        ).all()
        
        # Calculate total spending for percentages
        total_spending = sum(float(total) for _, total, _ in category_data)
        
        result = [
            {
                'category': category,
                'total_spent': float(total),
                'transaction_count': count,
                'percentage': round((float(total) / total_spending * 100), 2) if total_spending > 0 else 0.0
            }
            for category, total, count in category_data
        ]
        
        logger.info(f"✅ Calculated spending for {len(result)} categories")
        return result
    
    @staticmethod
    def calculate_burn_rate(db: Session, user_id: int, months: int = 6) -> Dict:
        """
        Calculate average monthly spending (burn rate).
        
        Args:
            db: Database session
            user_id: User ID
            months: Number of months to analyze
        
        Returns:
            Burn rate data including trend
        """
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        if not account_ids:
            return {
                'average_monthly_spending': 0.0,
                'months_analyzed': 0,
                'trend': 'stable'
            }
        
        # Get date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        # Query monthly spending
        monthly_spending = db.query(
            func.date_trunc('month', Transaction.txn_date).label('month'),
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == 'debit',
            Transaction.txn_date >= start_date,
            Transaction.txn_date <= end_date
        ).group_by(
            func.date_trunc('month', Transaction.txn_date)
        ).order_by(
            func.date_trunc('month', Transaction.txn_date)
        ).all()
        
        if not monthly_spending:
            return {
                'average_monthly_spending': 0.0,
                'months_analyzed': 0,
                'trend': 'stable'
            }
        
        # Calculate average
        monthly_totals = [float(total) for _, total in monthly_spending]
        average = sum(monthly_totals) / len(monthly_totals)
        
        # Determine trend (compare first half vs second half)
        mid = len(monthly_totals) // 2
        if len(monthly_totals) >= 4:
            first_half_avg = sum(monthly_totals[:mid]) / mid if mid > 0 else 0
            second_half_avg = sum(monthly_totals[mid:]) / (len(monthly_totals) - mid)
            
            if second_half_avg > first_half_avg * 1.1:  # 10% increase
                trend = 'increasing'
            elif second_half_avg < first_half_avg * 0.9:  # 10% decrease
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        logger.info(f"✅ Burn rate: ₹{average:.2f}/month, Trend: {trend}")
        
        return {
            'average_monthly_spending': round(average, 2),
            'months_analyzed': len(monthly_spending),
            'trend': trend
        }
    
    @staticmethod
    def get_yearly_trend(db: Session, user_id: int, year: int | None = None) -> List[Dict]:
        """
        Get monthly spending trend for a specific year.
        
        Args:
            db: Database session
            user_id: User ID
            year: Year to analyze (default: current year)
        
        Returns:
            List of monthly spending for the year
        """
        if year is None:
            year = datetime.now().year
        
        account_ids = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc[0] for acc in account_ids]
        
        if not account_ids:
            return []
        
        # Query spending by month for the year
        yearly_data = db.query(
            extract('month', Transaction.txn_date).label('month_num'),
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == 'debit',
            extract('year', Transaction.txn_date) == year
        ).group_by(
            extract('month', Transaction.txn_date)
        ).order_by(
            extract('month', Transaction.txn_date)
        ).all()
        
        # Month names
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        result = [
            {
                'year': year,
                'month': month_names[int(month_num) - 1],
                'total_spent': float(total)
            }
            for month_num, total in yearly_data
        ]
        
        logger.info(f"✅ Yearly trend for {year}: {len(result)} months")
        return result