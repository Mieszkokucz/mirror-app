from pydantic import BaseModel
import uuid
from typing import Optional, Literal
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[uuid.UUID] = None
    prompt: Optional[Literal["morning_reflection"]] = None


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
