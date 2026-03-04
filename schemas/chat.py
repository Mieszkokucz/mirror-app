from pydantic import BaseModel
import uuid
from typing import Optional, Literal


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[uuid.UUID] = None
    prompt: Optional[Literal["morning_reflection"]] = None


class ChatResponse(BaseModel):
    response: str
    session_id: uuid.UUID
