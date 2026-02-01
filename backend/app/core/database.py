from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os
from decouple import config
from urllib.parse import quote_plus

# Database credentials from environment variables
DB_USER = config("DB_USER", default="root")
DB_PASSWORD = config("DB_PASSWORD", default="Nish@123")
DB_HOST = config("DB_HOST", default="localhost")
DB_NAME = config("DB_NAME", default="selfie_attendance")

# Connection URL
encoded_password = quote_plus(DB_PASSWORD)
SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}"

# SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

# Session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
