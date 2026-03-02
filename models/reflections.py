from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, text

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
