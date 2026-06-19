from fastapi import HTTPException

from models.chat import Session as ChatSession, Message
from models.system_prompts import SystemPrompt
from services.conversation import build_system_prompt, load_conversation_history

FENCE = "~~~~"


def build_run_md(db, session_id) -> str:
    db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    final_assistant = (
        db.query(Message)
        .filter(Message.session_id == session_id, Message.role == "assistant")
        .order_by(Message.created_at.desc())
        .first()
    )

    if final_assistant is not None and final_assistant.model is not None:
        model = final_assistant.model
    else:
        model = "<FILL: model unknown (legacy)>"

    # prompt name encodes its version → used for both the title workflow and prompt_version
    prompt_name = "<FILL>"
    if db_session.prompt_id is not None:
        db_prompt = (
            db.query(SystemPrompt)
            .filter(SystemPrompt.id == db_session.prompt_id)
            .first()
        )
        if db_prompt is not None:
            prompt_name = db_prompt.name

    date = db_session.created_at.date()

    title = f"# Run — {prompt_name} — {date}\n"

    metadata = (
        "\n## 1. Metadane\n"
        f"- date: {date}\n"
        f"- model: {model}\n"
        "- temperature: domyślna 1.0\n"
        f"- prompt_version: {prompt_name}\n"
        f"- session_id: {session_id}\n"
        "- checklist_version: <FILL>\n"
    )

    system_prompt = build_system_prompt(db, session_id)
    context = (
        "\n## 2. Kontekst wejściowy (verbatim, jak wysłano do LLM)\n"
        f"{FENCE}\n{system_prompt or '(brak)'}\n{FENCE}\n"
    )

    history = load_conversation_history(db, session_id)
    lines = ["\n## 3. Konwersacja\n"]
    for msg in history:
        label = "llm" if msg.role == "assistant" else "user"
        lines.append(f"{label}:\n{FENCE}\n{msg.content}\n{FENCE}\n")
    conversation = "\n".join(lines)

    last_turn = final_assistant.content if final_assistant is not None else "(brak)"
    last = f"\n### Ostatnia tura\n{FENCE}\n{last_turn}\n{FENCE}\n"

    return title + metadata + context + conversation + last
