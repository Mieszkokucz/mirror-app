import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.projects import ProjectCreate, ProjectResponse
from services.projects import (
    create_project, get_projects, get_project, delete_project,
    attach_file_to_project, detach_file_from_project,
    attach_prompt_to_project, detach_prompt_from_project,
)

router = APIRouter()


@router.post("/projects/", response_model=ProjectResponse, status_code=201)
def create_project_endpoint(
    data: ProjectCreate,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return create_project(db, user_id, data)


@router.get("/projects/", response_model=list[ProjectResponse])
def list_projects(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_projects(db, user_id)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project_endpoint(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return get_project(db, project_id, user_id)


@router.delete("/projects/{project_id}", status_code=204)
def delete_project_endpoint(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    delete_project(db, project_id, user_id)


@router.post("/projects/{project_id}/files/{file_id}", status_code=201)
def attach_file(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    attach_file_to_project(db, project_id, file_id, user_id)


@router.delete("/projects/{project_id}/files/{file_id}", status_code=204)
def detach_file(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    detach_file_from_project(db, project_id, file_id, user_id)


@router.post("/projects/{project_id}/prompts/{prompt_id}", status_code=201)
def attach_prompt(
    project_id: uuid.UUID,
    prompt_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    attach_prompt_to_project(db, project_id, prompt_id, user_id)


@router.delete("/projects/{project_id}/prompts/{prompt_id}", status_code=204)
def detach_prompt(
    project_id: uuid.UUID,
    prompt_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    detach_prompt_from_project(db, project_id, prompt_id, user_id)
