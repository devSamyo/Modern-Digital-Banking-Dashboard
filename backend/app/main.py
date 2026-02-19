from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.account import Account
from app.models.category_rule import CategoryRule
from app.services.category_service import CategoryService
from app.services.alert_service import AlertService
from sqlalchemy import text
from app.routes import auth, accounts, transactions, categories, budgets, bills, rewards, insights, alerts, reports
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Modern Digital Banking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables (including category_rules and alerts)
Base.metadata.create_all(bind=engine)

# Seed default categories on startup
@app.on_event("startup")
def startup_event():
    """Seed default category rules and generate initial alerts when app starts"""
    db = SessionLocal()
    try:
        # Seed default categories
        CategoryService.seed_default_categories(db)
        
        # Generate alerts immediately on startup
        logger.info("🔔 Generating alerts on startup...")
        AlertService.generate_all_alerts(db)
        logger.info("✅ Startup complete. Celery Beat will handle scheduled alert generation.")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
    finally:
        db.close()

# Register routers
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(bills.router)
app.include_router(rewards.router)
app.include_router(insights.router)
app.include_router(alerts.router)
app.include_router(reports.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/db-check")
def db_check():
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1"))
            return {
                "db_status": "connected",
                "result": res.scalar()
            }
    except Exception as e:
        return {
            "db_status": "error",
            "details": str(e)
        }