import pytest
from unittest.mock import patch, MagicMock
from langchain_core.messages import HumanMessage, SystemMessage
from services.llm_gateway import _resolve_provider, send_to_llm


# --- _resolve_provider ---

def test_resolve_provider_claude():
    assert _resolve_provider("claude-haiku-4-5-20251001") == "anthropic"


def test_resolve_provider_gpt():
    assert _resolve_provider("gpt-4o") == "openai"


def test_resolve_provider_o1():
    assert _resolve_provider("o1-mini") == "openai"


def test_resolve_provider_o3():
    assert _resolve_provider("o3-mini") == "openai"


def test_resolve_provider_unknown():
    with pytest.raises(ValueError, match="Unknown provider"):
        _resolve_provider("llama-3-70b")


# --- send_to_llm ---

@patch("services.llm_gateway.init_chat_model")
def test_send_to_llm_uses_anthropic_provider(mock_init):
    mock_init.return_value.invoke.return_value.content = "anthropic response"

    result = send_to_llm([HumanMessage(content="hi")], "claude-haiku-4-5-20251001")

    assert result == "anthropic response"
    assert mock_init.call_args.kwargs["model_provider"] == "anthropic"


@patch("services.llm_gateway.init_chat_model")
def test_send_to_llm_uses_openai_provider(mock_init):
    mock_init.return_value.invoke.return_value.content = "openai response"

    result = send_to_llm([HumanMessage(content="hi")], "gpt-4o")

    assert result == "openai response"
    assert mock_init.call_args.kwargs["model_provider"] == "openai"


@patch("services.llm_gateway.init_chat_model")
def test_send_to_llm_passes_messages_to_invoke(mock_init):
    mock_llm = MagicMock()
    mock_init.return_value = mock_llm
    messages = [SystemMessage(content="Be helpful"), HumanMessage(content="hello")]

    send_to_llm(messages, "claude-haiku-4-5-20251001")

    mock_llm.invoke.assert_called_once_with(messages)


def test_send_to_llm_unknown_model_raises():
    with pytest.raises(ValueError, match="Unknown provider"):
        send_to_llm([HumanMessage(content="hi")], "llama-3-70b")
