from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CategoryRuleCreate(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=100)
    keywords: List[str] = Field(..., min_length=1)
    merchant_patterns: Optional[List[str]] = Field(default=[])

class CategoryRuleUpdate(BaseModel):
    category_name: Optional[str] = Field(None, min_length=1, max_length=100)
    keywords: Optional[List[str]] = Field(None, min_length=1)
    merchant_patterns: Optional[List[str]] = None

class CategoryRuleOut(BaseModel):
    id: int
    user_id: Optional[int]
    category_name: str
    keywords: List[str]
    merchant_patterns: Optional[List[str]]
    is_system_default: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CategoryOut(BaseModel):
    """Simple category name output"""
    name: str

class TransactionCategoryUpdate(BaseModel):
    """Schema for manually updating a transaction's category"""
    category: str = Field(..., min_length=1, max_length=100)