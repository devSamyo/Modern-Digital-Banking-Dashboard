from pydantic import BaseModel
from typing import List, Dict
from decimal import Decimal


class MonthlyCashFlow(BaseModel):
    month: str  # Format: "2026-02"
    total_credits: float
    total_debits: float
    net_savings: float


class TopMerchant(BaseModel):
    merchant: str
    total_spent: float
    transaction_count: int


class CategorySpending(BaseModel):
    category: str
    total_spent: float
    transaction_count: int
    percentage: float  # Percentage of total spending


class BurnRate(BaseModel):
    average_monthly_spending: float
    months_analyzed: int
    trend: str  # "increasing", "decreasing", "stable"


class InsightsSummary(BaseModel):
    monthly_cash_flow: List[MonthlyCashFlow]
    top_merchants: List[TopMerchant]
    category_spending: List[CategorySpending]
    burn_rate: BurnRate
    total_transactions: int
    
    class Config:
        from_attributes = True


class YearlyTrend(BaseModel):
    year: int
    month: str
    total_spent: float