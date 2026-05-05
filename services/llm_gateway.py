import anthropic
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
_openai_client: OpenAI | None = None


def _get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client


def _call_anthropic(messages, system_prompt, model):
    resp = _anthropic_client.messages.create(
        model=model, max_tokens=5000, messages=messages, system=system_prompt
    )
    return resp.content[0].text


def _call_openai(messages, system_prompt, model):
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    resp = _get_openai_client().chat.completions.create(
        model=model, max_tokens=5000, messages=full_messages
    )
    return resp.choices[0].message.content


def _resolve_provider(model: str) -> str:
    if model.startswith("claude"):
        return "anthropic"
    if model.startswith(("gpt", "o1", "o3")):
        return "openai"
    raise ValueError(f"Unknown provider for model: {model}")


def send_to_llm(messages, system_prompt, model):
    provider = _resolve_provider(model)
    if provider == "anthropic":
        return _call_anthropic(messages, system_prompt, model)
    if provider == "openai":
        return _call_openai(messages, system_prompt, model)
