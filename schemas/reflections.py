from pydantic import BaseModel
import uuid
import datetime
from typing import Optional
from pydantic import ConfigDict


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

    model_config = ConfigDict(from_attributes=True)


class DailyReflectionUpdate(BaseModel):
    reflection_type: Optional[str] = None
    content: Optional[str] = None
    date: Optional[datetime.date] = None


class PeriodicReflectionCreate(BaseModel):
    user_id: uuid.UUID
    reflection_type: str
    content: str
    date_from: datetime.date
    date_to: datetime.date


class PeriodicReflectionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    reflection_type: str
    date_from: datetime.date
    date_to: datetime.date
    content: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class PeriodicReflectionUpdate(BaseModel):
    reflection_type: Optional[str] = None
    content: Optional[str] = None
    date_from: Optional[datetime.date] = None
    date_to: Optional[datetime.date] = None
