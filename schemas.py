from pydantic import BaseModel
import uuid
import datetime
from typing import Optional


class DailyReflectionCreate(BaseModel):
    user_id: uuid.UUID
    reflection_type: str
    content: str
    date: datetime.date


class DailyReflectionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    reflection_type: str
    date: datetime.date
    content: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class DailyReflectionUpdate(BaseModel):
    reflection_type: Optional[str] = None
    content: Optional[str] = None
    date: Optional[datetime.date] = None
