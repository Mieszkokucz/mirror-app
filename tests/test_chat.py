from models.chat import Session
from models.chat import Message
import uuid
from unittest.mock import patch


def test_get_sessions_list(client, db_session, test_user):
    # create sessions (x2)
    session = Session(user_id=test_user.id)
    db_session.add(session)
    session = Session(user_id=test_user.id)
    db_session.add(session)
    db_session.commit()

    response = client.get("/chat/sessions", params={"user_id": str(test_user.id)})
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_sessions_list_empty(client, test_user):
    response = client.get("/chat/sessions", params={"user_id": str(test_user.id)})
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_get_session_messages_list(client, db_session, test_user):
    # add session
    session = Session(user_id=test_user.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    # add messages
    message = Message(session_id=session.id, role="user", content="hi")
    db_session.add(message)
    db_session.commit()

    message = Message(
        session_id=session.id, role="assistant", content="hi, how are you?"
    )
    db_session.add(message)
    db_session.commit()

    response = client.get(
        f"/chat/sessions/{session.id}/messages",
    )

    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["content"] == "hi"


def test_get_session_messages_empty(client):
    response = client.get(f"/chat/sessions/{uuid.uuid4()}/messages")
    assert response.status_code == 200
    assert len(response.json()) == 0


@patch("services.conversation.send_to_anthropic", return_value="mocked response")
def test_create_chat_new_session(mock_llm, client, test_user):
    response = client.post(
        "/chat/", json={"message": "hi", "user_id": str(test_user.id)}
    )
    assert response.status_code == 200
    assert "session_id" in response.json()
    assert response.json()["response"] == "mocked response"
    mock_llm.assert_called_once()


@patch("services.conversation.send_to_anthropic", return_value="mocked response")
def test_create_chat_with_prompt_id(mock_llm, client, db_session, test_user):
    from models.system_prompts import SystemPrompt

    prompt = SystemPrompt(
        name="test_prompt",
        display_name="Test",
        content="You are a test assistant.",
    )
    db_session.add(prompt)
    db_session.commit()
    db_session.refresh(prompt)

    response = client.post(
        "/chat/",
        json={
            "message": "hi",
            "user_id": str(test_user.id),
            "prompt_id": str(prompt.id),
        },
    )
    assert response.status_code == 200
    call_kwargs = mock_llm.call_args
    assert call_kwargs[1]["system_prompt"] == "You are a test assistant."


@patch("services.conversation.send_to_anthropic", return_value="mocked response")
def test_create_chat_with_invalid_prompt_id(mock_llm, client, test_user):
    response = client.post(
        "/chat/",
        json={
            "message": "hi",
            "user_id": str(test_user.id),
            "prompt_id": str(uuid.uuid4()),
        },
    )
    assert response.status_code == 404


@patch("services.conversation.send_to_anthropic", return_value="mocked response")
def test_create_chat_existing_session(mock_llm, client, db_session, test_user):
    # add session
    session = Session(user_id=test_user.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    response = client.post(
        "/chat/",
        json={
            "message": "hi",
            "user_id": str(test_user.id),
            "session_id": str(session.id),
        },
    )

    assert response.status_code == 200
    assert response.json()["session_id"] == str(session.id)
    assert response.json()["response"] == "mocked response"
    mock_llm.assert_called_once()
