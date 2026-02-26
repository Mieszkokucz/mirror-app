from pydantic import BaseModel
import uuid
import datetime


class DailyReflectionCreate(BaseModel):
    user_id: uuid.UUID
    reflection_type: str
    content: str
    date: datetime.date
