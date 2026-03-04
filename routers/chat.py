from fastapi import APIRouter, Depends
from database import get_db
from sqlalchemy.orm import Session

from schemas.chat import ChatRequest, ChatResponse
from services.conversation import handle_chat


router = APIRouter()


@router.post("/chat/", response_model=ChatResponse)
def create_chat(chat: ChatRequest, db: Session = Depends(get_db)):
    result = handle_chat(db, chat.message, chat.session_id, chat.prompt)
    return result
