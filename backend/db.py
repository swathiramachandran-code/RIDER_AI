"""
Database configuration and SQLite models for prediction history with safe migrations.
"""

from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    Text,
    create_engine,
    inspect,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

# Database file placed in backend directory
BACKEND_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{BACKEND_DIR / 'predictions.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    brand = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    km_driven = Column(Integer, nullable=False)
    fuel = Column(String(30), nullable=False)
    transmission = Column(String(30), nullable=False)
    owner = Column(String(50), nullable=False)
    predicted_price = Column(Float, nullable=False)
    price_low = Column(Float, nullable=False)
    price_high = Column(Float, nullable=False)

    # Extended vehicle condition and health columns
    base_price = Column(Float, nullable=True, default=0.0)
    condition = Column(String(50), nullable=True, default="Good")
    working_status = Column(String(50), nullable=True, default="Fully working")
    accident_history = Column(String(50), nullable=True, default="None")
    service_history = Column(String(50), nullable=True, default="Partial")
    extras = Column(Text, nullable=True, default="{}")
    health_score = Column(Integer, nullable=True, default=80)


def init_db():
    """Create tables and safely migrate new columns without losing existing rows."""
    Base.metadata.create_all(bind=engine)

    # Safe SQLite migration
    inspector = inspect(engine)
    if "predictions" in inspector.get_table_names():
        existing_cols = {c["name"] for c in inspector.get_columns("predictions")}
        
        column_migrations = [
            ("base_price", "FLOAT DEFAULT 0.0"),
            ("condition", "VARCHAR(50) DEFAULT 'Good'"),
            ("working_status", "VARCHAR(50) DEFAULT 'Fully working'"),
            ("accident_history", "VARCHAR(50) DEFAULT 'None'"),
            ("service_history", "VARCHAR(50) DEFAULT 'Partial'"),
            ("extras", "TEXT DEFAULT '{}'"),
            ("health_score", "INTEGER DEFAULT 80"),
        ]

        with engine.connect() as conn:
            for col_name, col_def in column_migrations:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE predictions ADD COLUMN {col_name} {col_def}"))
            
            # Backfill base_price for any existing historical rows where it was 0 or null
            conn.execute(
                text("UPDATE predictions SET base_price = predicted_price WHERE base_price IS NULL OR base_price = 0.0")
            )
            conn.commit()


def get_db():
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
