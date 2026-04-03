from fastapi import APIRouter, Depends
from database import get_db
from sqlalchemy.orm import Session
import uuid


from schemas.chat import ChatRequest, ChatResponse, SessionResponse, MessageResponse
from models.chat import Session as ChatSession, Message
from services.conversation import handle_chat


router = APIRouter()


@router.post("/chat/", response_model=ChatResponse)
def create_chat(chat: ChatRequest, db: Session = Depends(get_db)):
    result = handle_chat(
        db,
        chat.user_id,
        chat.message,
        chat.session_id,
        chat.prompt_id,
        chat.model,
        chat.context_reflection_ids,
    )
    return result


@router.get("/chat/sessions", response_model=list[SessionResponse])
def read_sessions(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return (
        db.query(ChatSession.id, ChatSession.updated_at)
        .filter(ChatSession.user_id == user_id)
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
