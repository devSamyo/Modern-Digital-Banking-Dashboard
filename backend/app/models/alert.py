from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import datetime
from typing import Optional


class Alert(Base):
    __tablename__ = "alerts"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)  # low_balance, bill_due, budget_exceeded
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    read_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    
    # Optional: Reference to the related entity
    related_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # account_id, bill_id, or budget_id
    
    # Relationship
    user = relationship("User", back_populates="alerts")
    
    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.alert_type}, read={self.read_status})>"