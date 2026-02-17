from sqlalchemy import Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String)
    kyc_status: Mapped[str] = mapped_column(String, default="unverified")
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    budgets = relationship("Budget", back_populates="user", lazy="dynamic")
    bills = relationship("Bill", back_populates="user", lazy="dynamic")
    rewards = relationship("Reward", back_populates="user", cascade="all, delete-orphan")