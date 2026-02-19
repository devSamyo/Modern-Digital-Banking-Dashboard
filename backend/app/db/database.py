from sqlalchemy import create_engine
from app.core.config import DATABASE_URL
from sqlalchemy.orm import sessionmaker, declarative_base

engine=create_engine(DATABASE_URL)

# def test_conn():
#     try:
#         with engine.connect() as conn:
#             print("Database connection successful")
#     except Exception as e:
#         print("Database connection failed", e)
      
SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)

Base=declarative_base()

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

from app.models import user, budget, bill, reward