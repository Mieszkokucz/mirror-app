from fastapi import APIRouter
from schemas.chat import ChatRequest, ChatResponse
from services.llm_gateway import send_to_anthropic

router = APIRouter()


@router.post("/chat/", response_model=ChatResponse)
def create_chat(chat: ChatRequest):
    response = send_to_anthropic(
        [{"role": "user", "content": chat.message}],
        "Przetłumacz na angielski",
        "claude-haiku-4-5-20251001",
    )
    return {"response": response}
