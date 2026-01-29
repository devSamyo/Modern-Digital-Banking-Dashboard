from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

class TransactionCreate(BaseModel):
    account_id: int
    description: str
    # category is AUTO-ASSIGNED, not provided by user
    amount: Decimal
    currency: str
    txn_type: str
    merchant: str | None = None

class TransactionOut(BaseModel):
    id: int
    account_id: int
    description: str
    category: str  # Displayed in output
    amount: Decimal
    currency: str
    txn_type: str
    merchant: str | None
    txn_date: datetime
    posted_date: datetime | None
    
    class Config:
        from_attributes = True