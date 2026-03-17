def test_create_reflection(client, db_session):
    from models.reflections import Users

    user = Users(nick="testuser")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    response = client.post(
        "/reflections/",
        json={
            "user_id": str(user.id),
            "reflection_type": "morning",
            "content": "testcontent",
            "date": "2026-03-17",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
