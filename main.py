from fastapi import FastAPI, Depends
from database import SessionLocal
from sqlalchemy.orm import Session


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
