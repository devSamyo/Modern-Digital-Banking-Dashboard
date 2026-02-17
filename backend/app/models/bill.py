from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import date, datetime
from typing import Optional
import enum

class BillStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    PAID = "paid"
    OVERDUE = "overdue"

class Bill(Base):
    __tablename__ = "bills"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    biller_name: Mapped[str] = mapped_column(String(100), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_due: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, default="upcoming")
    auto_pay: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    
    # Reminder tracking fields - NEW
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=True)
    reminder_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="bills")