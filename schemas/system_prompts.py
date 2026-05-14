from pydantic import BaseModel, ConfigDict
from typing import Literal, Optional
import uuid
import datetime

SystemPromptType = Literal["default", "periodic_weekly", "periodic_monthly"]


class SystemPromptCreate(BaseModel):
    name: str
    display_name: str
    content: str
    user_id: Optional[uuid.UUID]
    type: SystemPromptType = "default"


class SystemPromptResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    name: str
    display_name: str
    content: str
    type: SystemPromptType
    created_at: datetime.datetime
    updated_at: datetime.datetime
    project_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class SystemPromptUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    content: Optional[str] = None
    type: Optional[SystemPromptType] = None
