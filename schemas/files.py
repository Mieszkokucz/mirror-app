from pydantic import BaseModel, ConfigDict
import uuid
import datetime


class FileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    mime_type: str
    size_bytes: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class MessageAttachmentResponse(BaseModel):
    id: uuid.UUID
    message_id: uuid.UUID
    filename: str
    mime_type: str
    size_bytes: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
