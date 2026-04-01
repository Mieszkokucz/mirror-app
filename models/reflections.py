from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    text,
    CheckConstraint,
    UniqueConstraint,
)

from database import Base


class Users(Base):
    __tablename__ = "users"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    nick = Column(String(30), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("NOW()"))


class DailyReflection(Base):
    __tablename__ = "daily_reflection"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reflection_type = Column(String(30), nullable=False)
    date = Column(Date, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )

    __table_args__ = (
        CheckConstraint(
            "reflection_type IN ('morning', 'midday', 'evening')",
            name="ck__daily_reflection__reflection_type",
        ),
        UniqueConstraint(
            "user_id",
            "date",
            "reflection_type",
            name="uq__daily_reflection__user_id__date__reflection_type",
        ),
    )


class PeriodicReflection(Base):
    __tablename__ = "periodic_reflection"

    id = Column(
        UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()")
    )
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reflection_type = Column(String(30), nullable=False)
    date_from = Column(Date, nullable=False)
    date_to = Column(Date, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )

    __table_args__ = (
        CheckConstraint(
            "reflection_type IN ('weekly', 'monthly')",
            name="ck__periodic_reflection__reflection_type",
        ),
        UniqueConstraint(
            "user_id",
            "date_from",
            "date_to",
            "reflection_type",
            name="uq__periodic_reflection__user_date_from_to_type",
        ),
    )
