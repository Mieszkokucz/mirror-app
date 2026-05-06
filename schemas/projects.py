from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str]
    created_at: datetime


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
