from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class File(Base):
    __tablename__ = "file"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    content_hash = Column(String(64), nullable=False)
    project_id = Column(UUID, ForeignKey("project.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )


class MessageAttachment(Base):
    __tablename__ = "message_attachment"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    message_id = Column(
        UUID, ForeignKey("message.id", ondelete="CASCADE"), nullable=False
    )
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
