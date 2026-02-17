from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, CheckConstraint, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Budget(Base):
    __tablename__ = "budgets"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    limit_amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="budgets", lazy="select")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'category', 'month', 'year', name='unique_user_category_month_year'),
        CheckConstraint('month >= 1 AND month <= 12', name='check_month'),
        CheckConstraint('year >= 2000 AND year <= 2100', name='check_year'),
        CheckConstraint('limit_amount > 0', name='check_limit_amount'),
    )