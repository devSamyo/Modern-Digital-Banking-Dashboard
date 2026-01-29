from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class BudgetCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    month: int = Field(..., ge=1, le=12)  # 1-12
    year: int = Field(..., ge=2000, le=2100)
    limit_amount: float = Field(..., gt=0)

class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = Field(None, gt=0)

class BudgetOut(BaseModel):
    id: int
    user_id: int
    category: str
    month: int
    year: int
    limit_amount: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class BudgetWithSpending(BaseModel):
    """Budget with dynamically calculated spending information"""
    id: int
    user_id: int
    category: str
    month: int
    year: int
    limit_amount: float
    spent_amount: float  # Dynamically calculated
    remaining_amount: float
    is_over_budget: bool
    percentage_used: float
    created_at: datetime
    
    class Config:
        from_attributes = True