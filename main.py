from fastapi import FastAPI, Depends
from database import SessionLocal
from sqlalchemy.orm import Session
from models import DailyReflection
from schemas import DailyReflectionCreate


app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def first_endpoint(db: Session = Depends(get_db)):
    return {"status": "ok"}


@app.post("/reflections/")
def create_daily_reflection(
    reflection: DailyReflectionCreate, db: Session = Depends(get_db)
):
    db_reflection = DailyReflection(
        user_id=reflection.user_id,
        reflection_type=reflection.reflection_type,
        content=reflection.content,
        date=reflection.date,
    )

    db.add(db_reflection)
    db.commit()
    db.refresh(db_reflection)

    return {"status": "ok"}
