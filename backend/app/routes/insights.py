from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.insight_service import InsightService
from app.schemas.insight import InsightsSummary

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/summary")
def get_insights_summary(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive insights summary for the logged-in user.
    """
    monthly_cash_flow = InsightService.calculate_monthly_cash_flow(db, current_user.id, months)
    top_merchants = InsightService.calculate_top_merchants(db, current_user.id, limit=5)
    category_spending = InsightService.calculate_category_spending(db, current_user.id)
    burn_rate = InsightService.calculate_burn_rate(db, current_user.id, months)
    transactions = InsightService.get_user_transactions(db, current_user.id)
    
    return {
        "monthly_cash_flow": monthly_cash_flow,
        "top_merchants": top_merchants,
        "category_spending": category_spending,
        "burn_rate": burn_rate,
        "total_transactions": len(transactions)
    }


@router.get("/yearly-trend")
def get_yearly_trend(
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get yearly spending trend for a specific year.
    """
    if year is None:
        year = datetime.now().year
        
    yearly_data = InsightService.get_yearly_trend(db, current_user.id, year)
    return {"data": yearly_data, "year": year}