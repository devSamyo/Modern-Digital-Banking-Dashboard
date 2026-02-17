from sqlalchemy import create_engine
from app.core.config import DB_HOST, DB_PORT, DB_NAME,DB_USER, DB_PASSWORD
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = (f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

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