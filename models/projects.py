from sqlalchemy import Column, ForeignKey, String, Text, DateTime, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from database import Base


class Project(Base):
    __tablename__ = "project"

    id = Column(UUID, primary_key=True, nullable=False, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))


class ProjectFile(Base):
    __tablename__ = "project_file"

    project_id = Column(UUID, ForeignKey("project.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(UUID, ForeignKey("file.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("project_id", "file_id"),
    )


class ProjectSystemPrompt(Base):
    __tablename__ = "project_system_prompt"

    project_id = Column(UUID, ForeignKey("project.id", ondelete="CASCADE"), nullable=False)
    system_prompt_id = Column(UUID, ForeignKey("system_prompt.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("project_id", "system_prompt_id"),
    )
