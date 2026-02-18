from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AlertCreate(BaseModel):
    alert_type: str = Field(..., description="Type: low_balance, bill_due, budget_exceeded")
    message: str = Field(..., min_length=1, max_length=500)
    related_id: Optional[int] = Field(None, description="Related entity ID (optional)")


class AlertOut(BaseModel):
    id: int
    user_id: int
    alert_type: str
    message: str
    read_status: bool
    created_at: datetime
    related_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class AlertMarkRead(BaseModel):
    read_status: bool = True


class AlertsSummary(BaseModel):
    total_alerts: int
    unread_count: int
    alerts: list[AlertOut]