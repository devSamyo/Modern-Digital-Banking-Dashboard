from sqlalchemy import Integer, String, TIMESTAMP, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, List

class CategoryRule(Base):
    __tablename__ = "category_rules"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Foreign key to user (None = system default rule available to all users)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=True
    )
    
    # Category name (e.g., "Food & Dining", "Transportation")
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Keywords to match in transaction description/merchant
    # Stored as JSON array: ["amazon", "aws", "prime"]
    keywords: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=[])
    
    # Merchant patterns to match
    # Stored as JSON array: ["walmart", "target", "costco"]
    merchant_patterns: Mapped[Optional[List[str]]] = mapped_column(
        JSON, 
        nullable=True,
        default=[]
    )
    
    # Is this a system default rule? (True = available to all users)
    is_system_default: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False
    )
    
    # Timestamps
    created_at: Mapped[str] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False
    )
    
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )