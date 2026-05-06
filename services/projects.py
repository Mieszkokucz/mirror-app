import os
import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.projects import Project, ProjectFile, ProjectSystemPrompt
from models.files import File
from models.system_prompts import SystemPrompt
from schemas.projects import ProjectCreate


def _get_user_project(db: Session, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def create_project(db: Session, user_id: uuid.UUID, data: ProjectCreate) -> Project:
    project = Project(user_id=user_id, name=data.name, description=data.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_projects(db: Session, user_id: uuid.UUID) -> list[Project]:
    return db.query(Project).filter(Project.user_id == user_id).all()


def get_project(db: Session, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
    return _get_user_project(db, project_id, user_id)


def delete_project(db: Session, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    project = _get_user_project(db, project_id, user_id)
    files = db.query(File).filter(File.project_id == project_id).all()
    for file in files:
        try:
            os.remove(file.storage_path)
        except FileNotFoundError:
            pass
    db.delete(project)
    db.commit()


def attach_file_to_project(db: Session, project_id: uuid.UUID, file_id: uuid.UUID, user_id: uuid.UUID) -> ProjectFile:
    _get_user_project(db, project_id, user_id)

    file = db.query(File).filter(File.id == file_id, File.user_id == user_id, File.project_id == None).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File not found or already assigned")

    existing = db.query(ProjectFile).filter(ProjectFile.project_id == project_id, ProjectFile.file_id == file_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="File already attached to project")

    link = ProjectFile(project_id=project_id, file_id=file_id)
    db.add(link)
    db.commit()
    return link


def detach_file_from_project(db: Session, project_id: uuid.UUID, file_id: uuid.UUID, user_id: uuid.UUID) -> None:
    _get_user_project(db, project_id, user_id)

    link = db.query(ProjectFile).filter(ProjectFile.project_id == project_id, ProjectFile.file_id == file_id).first()
    if link is None:
        raise HTTPException(status_code=404, detail="File not attached to project")

    db.delete(link)
    db.commit()


def attach_prompt_to_project(db: Session, project_id: uuid.UUID, prompt_id: uuid.UUID, user_id: uuid.UUID) -> ProjectSystemPrompt:
    _get_user_project(db, project_id, user_id)

    prompt = db.query(SystemPrompt).filter(
        SystemPrompt.id == prompt_id,
        SystemPrompt.project_id == None,
        (SystemPrompt.user_id == user_id) | (SystemPrompt.user_id == None)
    ).first()
    if prompt is None:
        raise HTTPException(status_code=404, detail="System prompt not found")

    existing = db.query(ProjectSystemPrompt).filter(
        ProjectSystemPrompt.project_id == project_id,
        ProjectSystemPrompt.system_prompt_id == prompt_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Prompt already attached to project")

    link = ProjectSystemPrompt(project_id=project_id, system_prompt_id=prompt_id)
    db.add(link)
    db.commit()
    return link


def detach_prompt_from_project(db: Session, project_id: uuid.UUID, prompt_id: uuid.UUID, user_id: uuid.UUID) -> None:
    _get_user_project(db, project_id, user_id)

    link = db.query(ProjectSystemPrompt).filter(
        ProjectSystemPrompt.project_id == project_id,
        ProjectSystemPrompt.system_prompt_id == prompt_id
    ).first()
    if link is None:
        raise HTTPException(status_code=404, detail="Prompt not attached to project")

    db.delete(link)
    db.commit()
