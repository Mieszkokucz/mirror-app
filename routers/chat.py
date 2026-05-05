from fastapi import APIRouter, Depends, Form, File, UploadFile
from typing import Optional, List
from database import get_db
from sqlalchemy.orm import Session
import uuid

from schemas.chat import ChatResponse, SessionResponse, MessageResponse
from models.chat import Session as ChatSession, Message
from services.conversation import handle_chat


router = APIRouter()


@router.post("/chat/", response_model=ChatResponse)
async def create_chat(
    message: str = Form(...),
    user_id: uuid.UUID = Form(...),
    session_id: Optional[uuid.UUID] = Form(None),
    prompt_id: Optional[uuid.UUID] = Form(None),
    model: str = Form("claude-haiku-4-5-20251001"),
    context_reflection_ids: Optional[List[uuid.UUID]] = Form(None),
    context_file_ids: Optional[List[uuid.UUID]] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    result = await handle_chat(
        db,
        user_id,
        message,
        session_id,
        prompt_id,
        model,
        context_reflection_ids,
        context_file_ids,
        files,
    )
    return result


@router.get("/chat/sessions", response_model=list[SessionResponse])
def read_sessions(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return (
        db.query(ChatSession.id, ChatSession.updated_at)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


@router.get(
    "/chat/sessions/{session_id}/messages", response_model=list[MessageResponse]
)
def read_messages(session_id: uuid.UUID, db: Session = Depends(get_db)):
    return (
        db.query(Message.role, Message.content, Message.created_at)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .all()
    )
