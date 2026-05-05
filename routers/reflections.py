from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from database import get_db
from sqlalchemy.orm import Session
from models.reflections import DailyReflection, PeriodicReflection
from schemas.reflections import (
    DailyReflectionCreate,
    DailyReflectionResponse,
    DailyReflectionUpdate,
    PeriodicReflectionCreate,
    PeriodicReflectionResponse,
    PeriodicReflectionUpdate,
)
import uuid
from datetime import date as DateType
from typing import Optional

router = APIRouter()


@router.get("/reflections/export")
def export_reflections(
    user_id: uuid.UUID,
    date_from: Optional[DateType] = None,
    date_to: Optional[DateType] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(DailyReflection)
        .filter(DailyReflection.user_id == user_id)
    )
    if date_from:
        query = query.filter(DailyReflection.date >= date_from)
    if date_to:
        query = query.filter(DailyReflection.date <= date_to)
    reflections = (
        query.order_by(DailyReflection.date, DailyReflection.reflection_type).all()
    )

    if not reflections:
        raise HTTPException(status_code=404, detail="No reflections found for this user")

    lines = []
    for r in reflections:
        lines.append(f"Date: {r.date}")
        lines.append(f"Type: {r.reflection_type}")
        lines.append(f"Content:\n{r.content}")
        lines.append("-" * 40)

    suffix = ""
    if date_from and date_to:
        suffix = f"_{date_from}_to_{date_to}"
    elif date_from:
        suffix = f"_from_{date_from}"
    elif date_to:
        suffix = f"_to_{date_to}"
    filename = f"reflections_export{suffix}.txt"

    return PlainTextResponse(
        content="\n".join(lines),
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


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
def read_daily_reflection(
    user_id: uuid.UUID, date: Optional[DateType] = None, db: Session = Depends(get_db)
):
    query = db.query(DailyReflection).filter(DailyReflection.user_id == user_id)
    if date:
        query = query.filter(DailyReflection.date == date)
    return query.all()


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


@router.post("/periodic-reflections/")
def create_periodic_reflection(
    reflection: PeriodicReflectionCreate, db: Session = Depends(get_db)
):
    db_reflection = PeriodicReflection(
        user_id=reflection.user_id,
        reflection_type=reflection.reflection_type,
        content=reflection.content,
        date_from=reflection.date_from,
        date_to=reflection.date_to,
    )
    db.add(db_reflection)
    db.commit()
    return {"status": "ok"}


@router.get("/periodic-reflections/", response_model=list[PeriodicReflectionResponse])
def read_periodic_reflections(
    user_id: uuid.UUID,
    date_from: Optional[DateType] = None,
    date_to: Optional[DateType] = None,
    db: Session = Depends(get_db),
):
    query = db.query(PeriodicReflection).filter(PeriodicReflection.user_id == user_id)
    if date_from:
        query = query.filter(PeriodicReflection.date_from >= date_from)
    if date_to:
        query = query.filter(PeriodicReflection.date_to <= date_to)
    return query.all()


@router.get("/periodic-reflections/{reflection_id}", response_model=PeriodicReflectionResponse)
def read_periodic_reflection_by_id(
    reflection_id: uuid.UUID, db: Session = Depends(get_db)
):
    reflection = (
        db.query(PeriodicReflection).filter(PeriodicReflection.id == reflection_id).first()
    )
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")
    return reflection


@router.patch("/periodic-reflections/{reflection_id}", response_model=PeriodicReflectionResponse)
def update_periodic_reflection(
    reflection_id: uuid.UUID,
    new_data: PeriodicReflectionUpdate,
    db: Session = Depends(get_db),
):
    reflection = (
        db.query(PeriodicReflection).filter(PeriodicReflection.id == reflection_id).first()
    )
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")

    update_data = new_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reflection, key, value)

    db.commit()
    db.refresh(reflection)
    return reflection


@router.delete("/periodic-reflections/{reflection_id}", status_code=204)
def delete_periodic_reflection(reflection_id: uuid.UUID, db: Session = Depends(get_db)):
    reflection = (
        db.query(PeriodicReflection).filter(PeriodicReflection.id == reflection_id).first()
    )
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")

    db.delete(reflection)
    db.commit()
