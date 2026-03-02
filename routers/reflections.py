from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from sqlalchemy.orm import Session
from models.reflections import DailyReflection
from schemas.reflections import (
    DailyReflectionCreate,
    DailyReflectionResponse,
    DailyReflectionUpdate,
)
import uuid

router = APIRouter()


@router.post("/reflections/")
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


@router.get("/reflections/", response_model=list[DailyReflectionResponse])
def read_daily_reflection(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(DailyReflection).filter(DailyReflection.user_id == user_id).all()


@router.get("/reflections/{reflection_id}", response_model=DailyReflectionResponse)
def read_daily_reflection_by_id(
    reflection_id: uuid.UUID, db: Session = Depends(get_db)
):
    reflection = (
        db.query(DailyReflection).filter(DailyReflection.id == reflection_id).first()
    )
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")
    return reflection


@router.patch("/reflections/{reflection_id}", response_model=DailyReflectionResponse)
def update_daily_reflection(
    reflection_id: uuid.UUID,
    new_data: DailyReflectionUpdate,
    db: Session = Depends(get_db),
):
    reflection = (
        db.query(DailyReflection).filter(DailyReflection.id == reflection_id).first()
    )
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")

    update_data = new_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(reflection, key, value)

    db.commit()
    db.refresh(reflection)

    return reflection


@router.delete("/reflections/{reflection_id}", status_code=204)
def delete_daily_reflection(reflection_id: uuid.UUID, db: Session = Depends(get_db)):
    reflection = (
        db.query(DailyReflection).filter(DailyReflection.id == reflection_id).first()
    )
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")

    db.delete(reflection)
    db.commit()
