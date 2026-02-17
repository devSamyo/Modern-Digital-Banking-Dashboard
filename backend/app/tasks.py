from celery import Celery
from app.db.database import SessionLocal
from app.services.bill_reminder_service import BillReminderService
from app.services.currency_service import ActiveCurrencyService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import celery app instance
from celery_app import celery_app


@celery_app.task(name='app.tasks.check_and_send_bill_reminders', bind=True)
def check_and_send_bill_reminders(self):
    """
    Celery task: Check bills and send reminders.
    Runs every 3 minutes (configured in celery_app.py for testing).
    """
    logger.info("=" * 80)
    logger.info("🚀 Celery task started: check_and_send_bill_reminders")
    logger.info(f"   Task ID: {self.request.id}")
    logger.info("=" * 80)
    
    db = SessionLocal()
    try:
        # Send reminders for bills due in next 3 days
        result = BillReminderService.send_reminders(db, days_ahead=3)
        
        logger.info("=" * 80)
        logger.info(f"📊 Task completed successfully!")
        logger.info(f"   Total reminders sent: {result['total_sent']}")
        logger.info(f"   Upcoming bills: {result['upcoming_count']}")
        logger.info(f"   Overdue bills: {result['overdue_count']}")
        logger.info(f"   Timestamp: {result['timestamp']}")
        logger.info("=" * 80)
        
        return result
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ Error in bill reminder task: {str(e)}")
        logger.error("=" * 80)
        # Re-raise to mark task as failed in Celery
        raise
    finally:
        db.close()


@celery_app.task(name='app.tasks.reset_reminder_flags', bind=True)
def reset_reminder_flags(self):
    """
    Celery task: Reset reminder flags.
    Runs every 5 minutes (for testing) or daily (in production).
    Allows sending reminders again for unpaid bills.
    """
    logger.info("=" * 80)
    logger.info("🔄 Celery task started: reset_reminder_flags")
    logger.info(f"   Task ID: {self.request.id}")
    logger.info("=" * 80)
    
    db = SessionLocal()
    try:
        BillReminderService.reset_reminders_for_new_cycle(db)
        
        logger.info("=" * 80)
        logger.info("✅ Reminder flags reset successfully")
        logger.info("=" * 80)
        
        return {"status": "success", "message": "Reminder flags reset"}
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ Error resetting reminder flags: {str(e)}")
        logger.error("=" * 80)
        raise
    finally:
        db.close()


@celery_app.task(name='app.tasks.refresh_exchange_rates', bind=True)
def refresh_exchange_rates(self):
    """
    Celery task: Refresh currency exchange rates.
    Runs periodically to keep rates up-to-date.
    """
    logger.info("=" * 80)
    logger.info("💱 Celery task started: refresh_exchange_rates")
    logger.info(f"   Task ID: {self.request.id}")
    logger.info("=" * 80)
    
    try:
        success = ActiveCurrencyService.refresh_rates()
        
        if success:
            cache_info = ActiveCurrencyService.get_cache_info()
            logger.info("=" * 80)
            logger.info("✅ Exchange rates refreshed successfully!")
            logger.info(f"   Base currency: {cache_info.get('base_currency')}")
            logger.info(f"   Available currencies: {cache_info.get('available_currencies')}")
            logger.info(f"   Last updated: {cache_info.get('last_updated')}")
            logger.info("=" * 80)
            
            return {
                'status': 'success',
                'cache_info': cache_info
            }
        else:
            logger.error("=" * 80)
            logger.error("❌ Failed to refresh exchange rates")
            logger.error("=" * 80)
            return {
                'status': 'error',
                'message': 'Failed to fetch rates from API'
            }
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ Error refreshing exchange rates: {str(e)}")
        logger.error("=" * 80)
        raise


@celery_app.task(name='app.tasks.test_task')
def test_task():
    """
    Simple test task to verify Celery is working.
    Run manually: celery -A celery_app call app.tasks.test_task
    """
    logger.info("✅ Test task executed successfully!")
    return {"status": "success", "message": "Celery is working!"}