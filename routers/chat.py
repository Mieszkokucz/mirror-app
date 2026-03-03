from fastapi import APIRouter, Depends
from database import get_db
from sqlalchemy.orm import Session
from models.chat import Session as ChatSession, Message

from schemas.chat import ChatRequest, ChatResponse
from services.llm_gateway import send_to_anthropic

router = APIRouter()


@router.post("/chat/", response_model=ChatResponse)
def create_chat(chat: ChatRequest, db: Session = Depends(get_db)):
    if chat.session_id is None:
        db_session = ChatSession(user_id="b2769e58-414b-4d6e-b7b2-643db1616bda")
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        session_id = db_session.id
    else:
        session_id = chat.session_id

    # save user message
    db_message = Message(session_id=session_id, role="user", content=chat.message)
    db.add(db_message)
    db.commit()

    # read whole session from db
    session_hist = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .all()
    )

    message_to_llm = list(
        {"role": msg.role, "content": msg.content} for msg in session_hist
    )

    response = send_to_anthropic(
        message_to_llm,
        "Przetłumacz na angielski",
        "claude-haiku-4-5-20251001",
    )

    # save assistant response
    db_message = Message(session_id=session_id, role="assistant", content=response)
    db.add(db_message)
    db.commit()

    return {"response": response, "session_id": session_id}
