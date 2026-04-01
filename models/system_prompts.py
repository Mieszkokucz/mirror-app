from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    text,
    UniqueConstraint,
    Index,
)

from database import Base


class SystemPrompt(Base):
    __tablename__ = "system_prompt"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(50), nullable=False)
    display_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq__system_prompt__user_id_name"),
        Index(
            "uq__system_prompt__name__builtin",
            "name",
            unique=True,
            postgresql_where=text("user_id IS NULL"),
        ),
    )
