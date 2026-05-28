from models.chat import Session, Message, MessageContext
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


def test_get_sessions_list_includes_prompt_id(client, db_session, test_user):
    from models.system_prompts import SystemPrompt

    prompt = SystemPrompt(
        name="p1",
        display_name="P1",
        content="x",
    )
    db_session.add(prompt)
    db_session.commit()
    db_session.refresh(prompt)

    session = Session(user_id=test_user.id, prompt_id=prompt.id)
    db_session.add(session)
    db_session.commit()

    response = client.get("/chat/sessions", params={"user_id": str(test_user.id)})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["prompt_id"] == str(prompt.id)


def test_get_session_detail_not_found(client):
    response = client.get(f"/chat/sessions/{uuid.uuid4()}")
    assert response.status_code == 404


def test_get_session_detail_no_user_messages(client, db_session, test_user):
    session = Session(user_id=test_user.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    response = client.get(f"/chat/sessions/{session.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(session.id)
    assert data["attached_contexts"] == []


def test_get_session_detail_returns_latest_user_message_contexts(
    client, db_session, test_user, test_reflection
):
    session = Session(user_id=test_user.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    first_msg = Message(session_id=session.id, role="user", content="first")
    db_session.add(first_msg)
    db_session.commit()
    db_session.refresh(first_msg)
    db_session.add(
        MessageContext(
            message_id=first_msg.id,
            context_type="reflection",
            context_id=test_reflection.id,
        )
    )
    db_session.commit()

    second_msg = Message(session_id=session.id, role="user", content="second")
    db_session.add(second_msg)
    db_session.commit()

    response = client.get(f"/chat/sessions/{session.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["attached_contexts"] == []


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


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_new_session_persists_prompt_id(
    mock_llm, client, db_session, test_user
):
    from models.system_prompts import SystemPrompt

    prompt = SystemPrompt(
        name="persist_prompt",
        display_name="Persist",
        content="You are persisted.",
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
    session_id = response.json()["session_id"]

    db_session.expire_all()
    persisted = (
        db_session.query(Session).filter(Session.id == uuid.UUID(session_id)).first()
    )
    assert persisted is not None
    assert persisted.prompt_id == prompt.id


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_existing_session_uses_session_prompt(
    mock_llm, client, db_session, test_user
):
    from models.system_prompts import SystemPrompt

    prompt_a = SystemPrompt(
        name="prompt_a",
        display_name="A",
        content="AAA-system-prompt-content",
    )
    prompt_b = SystemPrompt(
        name="prompt_b",
        display_name="B",
        content="BBB-system-prompt-content",
    )
    db_session.add(prompt_a)
    db_session.add(prompt_b)
    db_session.commit()
    db_session.refresh(prompt_a)
    db_session.refresh(prompt_b)

    session = Session(user_id=test_user.id, prompt_id=prompt_a.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "session_id": str(session.id),
            "prompt_id": str(prompt_b.id),
        },
    )

    assert response.status_code == 200
    call_kwargs = mock_llm.call_args
    assert "AAA-system-prompt-content" in call_kwargs[1]["system_prompt"]
    assert "BBB-system-prompt-content" not in call_kwargs[1]["system_prompt"]
    assert response.json()["prompt_id"] == str(prompt_a.id)


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_unknown_session_returns_404(mock_llm, client, test_user):
    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "session_id": str(uuid.uuid4()),
        },
    )
    assert response.status_code == 404


@patch("services.conversation.send_to_llm", return_value="mocked response")
def test_create_chat_does_not_accumulate_previous_contexts(
    mock_llm, client, test_user, test_reflection
):
    first = client.post(
        "/chat/",
        data={
            "message": "first",
            "user_id": str(test_user.id),
            "context_reflection_ids": str(test_reflection.id),
        },
    )
    assert first.status_code == 200
    session_id = first.json()["session_id"]

    second = client.post(
        "/chat/",
        data={
            "message": "second",
            "user_id": str(test_user.id),
            "session_id": session_id,
        },
    )
    assert second.status_code == 200

    system_prompt = mock_llm.call_args[1]["system_prompt"]
    assert "Previously attached" not in system_prompt
    assert "[Reflection:" not in system_prompt
    assert test_reflection.content not in system_prompt


def test_get_session_detail_returns_latest_user_message_contexts_positive(
    client, db_session, test_user, test_reflection
):
    session = Session(user_id=test_user.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    first_msg = Message(session_id=session.id, role="user", content="first")
    db_session.add(first_msg)
    db_session.commit()

    second_msg = Message(session_id=session.id, role="user", content="second")
    db_session.add(second_msg)
    db_session.commit()
    db_session.refresh(second_msg)
    db_session.add(
        MessageContext(
            message_id=second_msg.id,
            context_type="reflection",
            context_id=test_reflection.id,
        )
    )
    db_session.commit()

    response = client.get(f"/chat/sessions/{session.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["attached_contexts"] == [
        {"type": "reflection", "id": str(test_reflection.id)}
    ]
