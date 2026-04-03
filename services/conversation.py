from fastapi import HTTPException
from models.chat import Session as ChatSession, Message, MessageContext
from models.system_prompts import SystemPrompt
from models.reflections import DailyReflection
from services.llm_gateway import send_to_anthropic


def handle_chat(
    db, user_id, message, session_id, prompt_id, model, context_reflection_ids
):
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

    # add attached reflections to system prompt as
    if context_reflection_ids:
        reflection_list = (
            db.query(DailyReflection)
            .filter(DailyReflection.id.in_(context_reflection_ids))
            .all()
        )
        if len(reflection_list) < len(context_reflection_ids):
            raise HTTPException(
                status_code=404, detail="One or more reflection IDs not found"
            )

        system_prompt += "\n\n---\nThe user has attached the following reflections:\n\n"
        for reflection in reflection_list:
            system_prompt += f"[Reflection: {reflection.reflection_type}, {reflection.date}]\n{reflection.content}\n\n"

    # save user message
    db_message = Message(session_id=session_id, role="user", content=message)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # save message_context rows
    if context_reflection_ids:
        for context_reflection_id in context_reflection_ids:
            db_message_context = MessageContext(
                message_id=db_message.id,
                context_type="reflection",
                context_id=context_reflection_id,
            )
            db.add(db_message_context)
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
