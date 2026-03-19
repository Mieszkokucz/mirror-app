# najpier testy get sessions  get messages
from models.chat import Session
from models.chat import Message
import uuid


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


# następnie testy chat post bo tu mamy bardziej rozbudowaną logike

#   - test_create_chat_new_session (no session_id → creates one)
#   - test_create_chat_existing_session (with session_id → continues)
