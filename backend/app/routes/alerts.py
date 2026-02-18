from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertOut, AlertsSummary, AlertMarkRead
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=List[AlertOut])
def get_alerts(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all alerts for the logged-in user.
    """
    alerts = AlertService.get_user_alerts(db, current_user.id, unread_only)
    return alerts


@router.get("/summary", response_model=AlertsSummary)
def get_alerts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get alerts summary with unread count.
    """
    all_alerts = AlertService.get_user_alerts(db, current_user.id)
    unread_alerts = [a for a in all_alerts if not a.read_status]
    
    return {
        "total_alerts": len(all_alerts),
        "unread_count": len(unread_alerts),
        "alerts": all_alerts
    }


@router.put("/{alert_id}/mark-read")
def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a specific alert as read.
    """
    success = AlertService.mark_alert_as_read(db, alert_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Alert not found or unauthorized"
        )
    
    return {"message": "Alert marked as read"}


@router.put("/mark-all-read")
def mark_all_alerts_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all alerts as read for the user.
    """
    count = AlertService.mark_all_as_read(db, current_user.id)
    return {"message": f"{count} alerts marked as read"}


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific alert.
    """
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found or unauthorized"
        )
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"}