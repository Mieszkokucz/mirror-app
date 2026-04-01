from pydantic import BaseModel
import uuid
from typing import Literal, Optional
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    user_id: uuid.UUID
    session_id: Optional[uuid.UUID] = None
    prompt_id: Optional[uuid.UUID] = None
    model: Literal["claude-haiku-4-5-20251001", "claude-sonnet-4-20250514"] = (
        "claude-haiku-4-5-20251001"
    )


class ChatResponse(BaseModel):
    response: str
    session_id: uuid.UUID


class SessionResponse(BaseModel):
    id: uuid.UUID
    updated_at: datetime


class MessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime
