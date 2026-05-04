from fastapi import HTTPException
from models.chat import Session as ChatSession, Message, MessageContext
from models.system_prompts import SystemPrompt
from models.reflections import DailyReflection
from models.files import File
from services.llm_gateway import send_to_anthropic
from services.files import upload_message_attachment


async def handle_chat(
    db, user_id, message, session_id, prompt_id, model, context_reflection_ids, context_file_ids, files
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

    # add attached files to system prompt
    if context_file_ids:
        file_list = db.query(File).filter(File.id.in_(context_file_ids)).all()
        if len(file_list) < len(context_file_ids):
            raise HTTPException(status_code=404, detail="One or more file IDs not found")

        system_prompt += "\n\n---\nThe user has attached the following files:\n\n"
        for f in file_list:
            if not f.mime_type.startswith("text/"):
                raise HTTPException(
                    status_code=422,
                    detail=f"File '{f.filename}' has unsupported type '{f.mime_type}'. Only text files are supported."
                )
            try:
                content = open(f.storage_path, encoding="utf-8").read()
            except OSError:
                raise HTTPException(
                    status_code=500, detail=f"File '{f.filename}' could not be read from disk"
                )
            system_prompt += f"[File: {f.filename}]\n{content}\n\n"

    # append directly uploaded files inline to the user message
    if files:
        for f in files:
            if not (f.content_type or "").startswith("text/"):
                raise HTTPException(
                    status_code=422,
                    detail=f"File '{f.filename}' has unsupported type '{f.content_type}'. Only text files are supported."
                )
            data = await f.read()
            message += f"\n\n---\n[File: {f.filename}]\n{data.decode('utf-8')}"

    # save user message
    db_message = Message(session_id=session_id, role="user", content=message)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    if files:
        for f in files:
            await f.seek(0)
            await upload_message_attachment(f, db_message.id, db)

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

    if context_file_ids:
        for context_file_id in context_file_ids:
            db_message_context = MessageContext(
                message_id=db_message.id,
                context_type="file",
                context_id=context_file_id,
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
