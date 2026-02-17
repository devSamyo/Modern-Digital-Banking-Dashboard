from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class BillCreate(BaseModel):
    biller_name: str = Field(..., min_length=1, max_length=100)
    due_date: date
    amount_due: float = Field(..., gt=0)
    auto_pay: bool = False

class BillUpdate(BaseModel):
    biller_name: Optional[str] = Field(None, min_length=1, max_length=100)
    due_date: Optional[date] = None
    amount_due: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None
    auto_pay: Optional[bool] = None

class BillOut(BaseModel):
    id: int
    user_id: int
    biller_name: str
    due_date: date
    amount_due: float
    status: str
    auto_pay: bool
    created_at: datetime
    days_until_due: Optional[int] = None
    reminder_sent: bool = False
    reminder_sent_at: Optional[datetime] = None
    reminder_count: int = 0
    
    class Config:
        from_attributes = True