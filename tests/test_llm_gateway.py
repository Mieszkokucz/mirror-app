import pytest
from unittest.mock import patch, MagicMock
from services.llm_gateway import _resolve_provider, send_to_llm, _call_openai


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


# --- send_to_llm routing ---

@patch("services.llm_gateway._call_anthropic", return_value="anthropic response")
def test_send_to_llm_routes_to_anthropic(mock_anthropic):
    result = send_to_llm([{"role": "user", "content": "hi"}], "sys", "claude-haiku-4-5-20251001")
    mock_anthropic.assert_called_once()
    assert result == "anthropic response"


@patch("services.llm_gateway._call_openai", return_value="openai response")
def test_send_to_llm_routes_to_openai(mock_openai):
    result = send_to_llm([{"role": "user", "content": "hi"}], "sys", "gpt-4o")
    mock_openai.assert_called_once()
    assert result == "openai response"


# --- _call_openai message format ---

def test_call_openai_prepends_system_prompt():
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value.choices[0].message.content = "ok"

    with patch("services.llm_gateway._get_openai_client", return_value=mock_client):
        _call_openai([{"role": "user", "content": "hello"}], "Be helpful", "gpt-4o")

    messages = mock_client.chat.completions.create.call_args[1]["messages"]
    assert messages[0] == {"role": "system", "content": "Be helpful"}
    assert messages[1] == {"role": "user", "content": "hello"}
