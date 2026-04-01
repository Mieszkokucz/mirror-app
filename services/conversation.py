from fastapi import HTTPException
from models.chat import Session as ChatSession, Message
from models.system_prompts import SystemPrompt
from services.llm_gateway import send_to_anthropic


def handle_chat(db, user_id, message, session_id, prompt_id, model):
    if session_id is None:
        db_session = ChatSession(user_id=user_id)
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        session_id = db_session.id

    # resolve system prompt from DB
    system_prompt = ""
    if prompt_id is not None:
        db_prompt = db.query(SystemPrompt).filter(SystemPrompt.id == prompt_id).first()
        if db_prompt is None:
            raise HTTPException(status_code=404, detail="System prompt not found")
        system_prompt = db_prompt.content

    # save user message
    db_message = Message(session_id=session_id, role="user", content=message)
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
        system_prompt=system_prompt,
        model=model,
    )

    # save assistant response
    db_message = Message(session_id=session_id, role="assistant", content=response)
    db.add(db_message)
    db.commit()
    return {"response": response, "session_id": session_id}
