from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

load_dotenv()


def _resolve_provider(model: str) -> str:
    if model.startswith("claude"):
        return "anthropic"
    if model.startswith(("gpt", "o1", "o3")):
        return "openai"
    raise ValueError(f"Unknown provider for model: {model}")


def send_to_llm(messages, model):
    llm = init_chat_model(
        model, model_provider=_resolve_provider(model), max_tokens=5000
    )
    return llm.invoke(messages).content
