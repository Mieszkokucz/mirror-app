from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    text,
    CheckConstraint,
    PrimaryKeyConstraint,
)

from database import Base


class Session(Base):
    __tablename__ = "session"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )


class Message(Base):
    __tablename__ = "message"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    session_id = Column(
        UUID, ForeignKey("session.id", ondelete="CASCADE"), nullable=False
    )
    role = Column(String(30), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
    __table_args__ = (
        CheckConstraint("role IN ('user', 'assistant')", name="ck__message__role"),
    )


class MessageContext(Base):
    __tablename__ = "message_context"

    message_id = Column(
        UUID, ForeignKey("message.id", ondelete="CASCADE"), nullable=False
    )
    context_type = Column(String(30), nullable=False)
    context_id = Column(UUID, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "context_type IN ('reflection', 'file')",
            name="ck__message_context__context_type",
        ),
        PrimaryKeyConstraint("message_id", "context_type", "context_id"),
    )
