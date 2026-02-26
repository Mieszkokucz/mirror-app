from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


db = "postgresql://reflection_user:reflection_user_2026@localhost:5432/daily_reflection_db"
engine = create_engine(db)
SessionLocal = sessionmaker(engine)

Base = declarative_base()
