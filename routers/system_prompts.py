from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.system_prompts import SystemPrompt
from schemas.system_prompts import (
    SystemPromptCreate,
    SystemPromptResponse,
    SystemPromptUpdate,
)
import uuid

router = APIRouter()


@router.post("/system-prompts/", response_model=SystemPromptResponse)
def create_system_prompt(prompt: SystemPromptCreate, db: Session = Depends(get_db)):
    db_prompt = SystemPrompt(
        user_id=prompt.user_id,
        name=prompt.name,
        display_name=prompt.display_name,
        content=prompt.content,
    )

    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)

    return db_prompt


@router.get("/system-prompts/", response_model=list[SystemPromptResponse])
def list_system_prompts(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return (
        db.query(SystemPrompt)
        .filter((SystemPrompt.user_id == user_id) | (SystemPrompt.user_id.is_(None)))
        .all()
    )


@router.get("/system-prompts/{prompt_id}", response_model=SystemPromptResponse)
def get_system_prompt(prompt_id: uuid.UUID, db: Session = Depends(get_db)):
    prompt = db.query(SystemPrompt).filter(SystemPrompt.id == prompt_id).first()
    if prompt is None:
        raise HTTPException(status_code=404, detail="System prompt not found")
    return prompt


@router.patch("/system-prompts/{prompt_id}", response_model=SystemPromptResponse)
def update_system_prompt(
    prompt_id: uuid.UUID,
    new_data: SystemPromptUpdate,
    db: Session = Depends(get_db),
):
    prompt = db.query(SystemPrompt).filter(SystemPrompt.id == prompt_id).first()
    if prompt is None:
        raise HTTPException(status_code=404, detail="System prompt not found")

    update_data = new_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(prompt, key, value)

    db.commit()
    db.refresh(prompt)

    return prompt


@router.delete("/system-prompts/{prompt_id}", status_code=204)
def delete_system_prompt(prompt_id: uuid.UUID, db: Session = Depends(get_db)):
    prompt = db.query(SystemPrompt).filter(SystemPrompt.id == prompt_id).first()
    if prompt is None:
        raise HTTPException(status_code=404, detail="System prompt not found")

    if prompt.user_id is None:
        raise HTTPException(
            status_code=403, detail="Cannot delete built-in system prompt"
        )

    db.delete(prompt)
    db.commit()
