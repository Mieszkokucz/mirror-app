from models.chat import Session as ChatSession, Message
from services.llm_gateway import send_to_anthropic
from pathlib import Path

morning_prompt = Path(__file__).parent / "prompts" / "morning_reflection.txt"
SYSTEM_PROMPTS = {
    "morning_reflection": morning_prompt.read_text(encoding="utf-8"),
}


def handle_chat(db, message, session_id, prompt_key, model):
    if session_id is None:
        db_session = ChatSession(user_id="b2769e58-414b-4d6e-b7b2-643db1616bda")
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        session_id = db_session.id

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
        system_prompt=SYSTEM_PROMPTS.get(prompt_key, ""),
        model=model,
    )

    # save assistant response
    db_message = Message(session_id=session_id, role="assistant", content=response)
    db.add(db_message)
    db.commit()
    return {"response": response, "session_id": session_id}
