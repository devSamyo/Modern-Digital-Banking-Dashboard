from celery import Celery
from celery.schedules import crontab
import os

# Create Celery instance
celery_app = Celery(
    'bill_reminders',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0',
    include=['app.tasks']  # Import tasks module
)

# Celery configuration
celery_app.conf.update(
    timezone='Asia/Kolkata',  # Indian timezone
    enable_utc=True,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes max per task
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)


celery_app.conf.beat_schedule = {
    # Check and send bill reminders every 1 hour 
    'check-bill-reminders-every-1-hour': {
        'task': 'app.tasks.check_and_send_bill_reminders',
        'schedule': crontab(minute=0),  # Every hour at :00
    },
    
    # Reset reminder flags daily at midnight
    'reset-reminder-flags-daily': {
        'task': 'app.tasks.reset_reminder_flags',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
    
    # Refresh exchange rates every 6 hours
    'refresh-exchange-rates-every-6-hours': {
        'task': 'app.tasks.refresh_exchange_rates',
        'schedule': crontab(minute=0, hour='*/6'),  # Every 6 hours at :00
    },
    
    # Generate alerts every 6 hours
    'generate-alerts-every-6-hours': {
        'task': 'app.tasks.generate_alerts',
        'schedule': crontab(minute=0, hour='*/6'),  # Every 6 hours at :00
    },
}


"""
celery_app.conf.beat_schedule = {
    # Check and send bill reminders every hour
    'check-bill-reminders-hourly': {
        'task': 'app.tasks.check_and_send_bill_reminders',
        'schedule': crontab(minute=0),  # Every hour at :00
    },
    
    # Reset reminder flags daily at midnight
    'reset-reminder-flags-daily': {
        'task': 'app.tasks.reset_reminder_flags',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
    
    # Refresh exchange rates every 6 hours
    'refresh-exchange-rates-every-6-hours': {
        'task': 'app.tasks.refresh_exchange_rates',
        'schedule': crontab(minute=0, hour='*/6'),  # Every 6 hours at :00
    },
}
"""