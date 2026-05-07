from models.chat import Session
from models.chat import Message
import uuid
from unittest.mock import patch
from typing import List


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


def test_get_sessions_list_filter_by_project(client, db_session, test_user, test_project):
    session_with_project = Session(user_id=test_user.id, project_id=test_project.id)
    session_without_project = Session(user_id=test_user.id)
    db_session.add(session_with_project)
    db_session.add(session_without_project)
    db_session.commit()

    response = client.get(
        "/chat/sessions",
        params={"user_id": str(test_user.id), "project_id": str(test_project.id)},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["project_id"] == str(test_project.id)


def test_get_sessions_list_no_project_filter_returns_only_global(client, db_session, test_user, test_project):
    db_session.add(Session(user_id=test_user.id, project_id=test_project.id))
    db_session.add(Session(user_id=test_user.id))
    db_session.commit()

    response = client.get("/chat/sessions", params={"user_id": str(test_user.id)})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["project_id"] is None


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


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_new_session(mock_llm, client, test_user):
    response = client.post(
        "/chat/", data={"message": "hi", "user_id": str(test_user.id)}
    )
    assert response.status_code == 200
    assert "session_id" in response.json()
    assert response.json()["response"] == "mocked response"
    mock_llm.assert_called_once()


@patch("services.conversation.send_to_llm", return_value="mocked response")
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
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "prompt_id": str(prompt.id),
        },
    )
    assert response.status_code == 200
    call_kwargs = mock_llm.call_args
    assert call_kwargs[1]["system_prompt"] == "You are a test assistant."


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_with_invalid_prompt_id(mock_llm, client, test_user):
    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "prompt_id": str(uuid.uuid4()),
        },
    )
    assert response.status_code == 404


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_existing_session(mock_llm, client, db_session, test_user):
    # add session
    session = Session(user_id=test_user.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "session_id": str(session.id),
        },
    )

    assert response.status_code == 200
    assert response.json()["session_id"] == str(session.id)
    assert response.json()["response"] == "mocked response"
    mock_llm.assert_called_once()


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_with_context_reflections(
    mock_llm, client, test_user, test_reflection
):
    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "context_reflection_ids": str(test_reflection.id),
        },
    )

    assert response.status_code == 200
    call_kwargs = mock_llm.call_args
    assert "[Reflection: morning, 2026-03-19]" in call_kwargs[1]["system_prompt"]
    assert "test" in call_kwargs[1]["system_prompt"]
