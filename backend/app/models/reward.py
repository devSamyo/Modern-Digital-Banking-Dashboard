from sqlalchemy import Column, Integer, String, Float, ForeignKey, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import datetime
from typing import Optional


class Reward(Base):
    __tablename__ = "rewards"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    program_name: Mapped[str] = mapped_column(String(100), nullable=False)
    points_balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    
    # Optional: Track reward program details
    program_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "airline", "hotel", "cashback"
    conversion_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Points to currency rate
    
    # Relationship
    user = relationship("User", back_populates="rewards")
    
    def __repr__(self):
        return f"<Reward(id={self.id}, program={self.program_name}, points={self.points_balance})>"