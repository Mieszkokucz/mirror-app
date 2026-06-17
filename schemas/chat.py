from pydantic import BaseModel
import uuid
from typing import Literal, Optional, List
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    user_id: uuid.UUID
    session_id: Optional[uuid.UUID] = None
    prompt_id: Optional[uuid.UUID] = None
    model: Literal[
        "claude-haiku-4-5-20251001",
        "claude-sonnet-4-6",
        "gpt-5.4",
        "gpt-5.4-mini",
    ] = "claude-haiku-4-5-20251001"
    context_reflection_ids: Optional[List[uuid.UUID]] = None
    context_file_ids: Optional[List[uuid.UUID]] = None
    context_periodic_reflection_ids: Optional[List[uuid.UUID]] = None


class ChatResponse(BaseModel):
    response: str
    session_id: uuid.UUID
    prompt_id: Optional[uuid.UUID] = None


class SessionResponse(BaseModel):
    id: uuid.UUID
    updated_at: datetime
    project_id: Optional[uuid.UUID] = None
    prompt_id: Optional[uuid.UUID] = None


class MessageContextItem(BaseModel):
    type: Literal["reflection", "file", "periodic_reflection"]
    id: uuid.UUID


class SessionDetailResponse(SessionResponse):
    attached_contexts: List[MessageContextItem] = []


class MessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime
