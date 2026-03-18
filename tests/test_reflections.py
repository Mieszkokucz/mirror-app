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


def test_get_reflections_list(client, db_session):
    from models.reflections import Users

    # add user
    user = Users(nick="testuser")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # post reflections
    client.post(
        "/reflections/",
        json={
            "user_id": str(user.id),
            "reflection_type": "morning",
            "content": "testcontent",
            "date": "2026-03-17",
        },
    )
    client.post(
        "/reflections/",
        json={
            "user_id": str(user.id),
            "reflection_type": "evening",
            "content": "testcontent2",
            "date": "2026-03-18",
        },
    )

    response = client.get("/reflections/", params={"user_id": str(user.id)})

    # print(response.json())
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["reflection_type"] == "morning"
    assert response.json()[0]["content"] == "testcontent"
    assert response.json()[1]["reflection_type"] == "evening"
    assert response.json()[1]["content"] == "testcontent2"


def test_get_reflections_empty(client, db_session):
    from models.reflections import Users

    # add user
    user = Users(nick="testuser")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    response = client.get("/reflections/", params={"user_id": str(user.id)})

    assert response.status_code == 200
    assert len(response.json()) == 0


def test_get_reflection_by_id(client, db_session):
    from models.reflections import Users
    from models.reflections import DailyReflection

    # add user
    user = Users(nick="testuser")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # create reflections
    reflection = DailyReflection(
        user_id=user.id, reflection_type="morning", date="2026-03-19", content="test"
    )
    db_session.add(reflection)
    db_session.commit()
    db_session.refresh(reflection)

    response = client.get(f"/reflections/{reflection.id}")

    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert response.json()["reflection_type"] == "morning"
    assert response.json()["content"] == "test"


def test_get_reflection_by_id_not_found(client):
    import uuid

    response = client.get(f"/reflections/{uuid.uuid4()}")
    assert response.status_code == 404


# 4. test_update_reflection — PATCH with partial data, check updated fields
# 5. test_update_reflection_not_found — random UUID → 404
# 6. test_delete_reflection — DELETE, check 204, confirm it's
# 7. test_delete_reflection_not_found — random UUID → 404
