from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
import datetime


class SystemPromptCreate(BaseModel):
    name: str
    display_name: str
    content: str
    user_id: uuid.UUID


class SystemPromptResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    name: str
    display_name: str
    content: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class SystemPromptUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    content: Optional[str] = None
