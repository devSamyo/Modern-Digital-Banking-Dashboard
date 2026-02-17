from sqlalchemy.orm import Session
from app.models.bill import Bill
from app.models.user import User
from datetime import date, datetime, timedelta
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class BillReminderService:
    
    @staticmethod
    def send_email_reminder(user_email: str, bill_data: Dict):
        """
        Mock email sending - logs to console.
        In production, use SendGrid, AWS SES, etc.
        """
        logger.info("=" * 60)
        logger.info("📧 SENDING EMAIL REMINDER")
        logger.info("=" * 60)
        logger.info(f"To: {user_email}")
        logger.info(f"Subject: Bill Reminder - {bill_data['biller_name']}")
        logger.info("-" * 60)
        logger.info(f"Dear User,")
        logger.info(f"")
        logger.info(f"This is a reminder that your bill is {bill_data['status']}:")
        logger.info(f"")
        logger.info(f"  Biller: {bill_data['biller_name']}")
        logger.info(f"  Amount: ₹{bill_data['amount_due']:.2f}")
        logger.info(f"  Due Date: {bill_data['due_date']}")
        logger.info(f"  {bill_data['message']}")
        logger.info(f"")
        logger.info(f"Please pay your bill on time to avoid late fees.")
        logger.info(f"")
        logger.info(f"Best regards,")
        logger.info(f"Modern Digital Banking")
        logger.info("=" * 60)
    
    @staticmethod
    def check_upcoming_bills(db: Session, days_ahead: int = 3) -> List[Dict]:
        """
        Identify bills due in next N days that haven't been reminded.
        """
        today = date.today()
        future_date = today + timedelta(days=days_ahead)
        
        # Get bills due soon without reminders
        bills = db.query(Bill).filter(
            Bill.status == "upcoming",
            Bill.reminder_sent == False,
            Bill.due_date >= today,
            Bill.due_date <= future_date
        ).all()
        
        reminders = []
        for bill in bills:
            days_until = (bill.due_date - today).days
            
            if days_until == 0:
                message = "Due TODAY!"
                status = "due today"
            elif days_until == 1:
                message = "Due TOMORROW!"
                status = "due tomorrow"
            else:
                message = f"Due in {days_until} days"
                status = f"due in {days_until} days"
            
            reminders.append({
                'bill': bill,
                'message': message,
                'status': status
            })
        
        return reminders
    
    @staticmethod
    def check_overdue_bills(db: Session) -> List[Dict]:
        """
        Identify overdue bills that haven't been reminded recently.
        """
        today = date.today()
        
        # Get overdue bills without recent reminders (or never reminded)
        bills = db.query(Bill).filter(
            Bill.status == "overdue",
            Bill.reminder_sent == False
        ).all()
        
        reminders = []
        for bill in bills:
            days_overdue = (today - bill.due_date).days
            message = f"OVERDUE by {days_overdue} days!"
            status = "overdue"
            
            reminders.append({
                'bill': bill,
                'message': message,
                'status': status
            })
        
        return reminders
    
    @staticmethod
    def send_reminders(db: Session, days_ahead: int = 3) -> Dict:
        """
        Main function to check and send all bill reminders.
        Returns summary of reminders sent.
        """
        logger.info("🔔 Starting bill reminder check...")
        
        # Check upcoming bills
        upcoming_reminders = BillReminderService.check_upcoming_bills(db, days_ahead)
        logger.info(f"Found {len(upcoming_reminders)} upcoming bills needing reminders")
        
        # Check overdue bills
        overdue_reminders = BillReminderService.check_overdue_bills(db)
        logger.info(f"Found {len(overdue_reminders)} overdue bills needing reminders")
        
        # Send reminders
        sent_count = 0
        all_reminders = upcoming_reminders + overdue_reminders
        
        for reminder in all_reminders:
            bill = reminder['bill']
            
            # Get user email
            user = db.query(User).filter(User.id == bill.user_id).first()
            if not user:
                continue
            
            # Prepare email data
            email_data = {
                'biller_name': bill.biller_name,
                'amount_due': bill.amount_due,
                'due_date': bill.due_date.strftime('%Y-%m-%d'),
                'message': reminder['message'],
                'status': reminder['status']
            }
            
            # Send email (mock)
            BillReminderService.send_email_reminder(user.email, email_data)
            
            # Mark as sent
            bill.reminder_sent = True
            bill.reminder_sent_at = datetime.now()
            bill.reminder_count += 1
            sent_count += 1
        
        # Commit changes
        db.commit()
        
        logger.info(f"✅ Successfully sent {sent_count} bill reminders")
        
        return {
            'total_sent': sent_count,
            'upcoming_count': len(upcoming_reminders),
            'overdue_count': len(overdue_reminders),
            'timestamp': datetime.now().isoformat()
        }
    
    @staticmethod
    def reset_reminders_for_new_cycle(db: Session):
        """
        Reset reminder_sent flag for bills that need recurring reminders.
        Call this daily to allow sending reminders again.
        """
        # Reset reminder flag for unpaid bills
        bills = db.query(Bill).filter(
            Bill.status != "paid",
            Bill.reminder_sent == True
        ).all()
        
        for bill in bills:
            bill.reminder_sent = False
        
        db.commit()
        logger.info(f"Reset {len(bills)} bill reminder flags for new cycle")