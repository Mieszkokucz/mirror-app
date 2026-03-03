from pydantic import BaseModel
import uuid
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[uuid.UUID] = None


class ChatResponse(BaseModel):
    response: str
    session_id: uuid.UUID
