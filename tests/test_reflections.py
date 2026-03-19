import uuid


def test_create_reflection(client, test_user):
    response = client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "morning",
            "content": "testcontent",
            "date": "2026-03-17",
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_reflections_list(client, test_user):
    # post reflections
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "morning",
            "content": "testcontent",
            "date": "2026-03-17",
        },
    )
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "evening",
            "content": "testcontent2",
            "date": "2026-03-18",
        },
    )

    response = client.get("/reflections/", params={"user_id": str(test_user.id)})

    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["reflection_type"] == "morning"
    assert response.json()[0]["content"] == "testcontent"
    assert response.json()[1]["reflection_type"] == "evening"
    assert response.json()[1]["content"] == "testcontent2"


def test_get_reflections_empty(client, test_user):
    response = client.get("/reflections/", params={"user_id": str(test_user.id)})

    assert response.status_code == 200
    assert len(response.json()) == 0


def test_get_reflection_by_id(client, test_reflection):
    response = client.get(f"/reflections/{test_reflection.id}")

    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert response.json()["reflection_type"] == "morning"
    assert response.json()["content"] == "test"


def test_get_reflection_by_id_not_found(client):
    response = client.get(f"/reflections/{uuid.uuid4()}")
    assert response.status_code == 404


def test_update_reflection(client, test_reflection):

    # update reflection
    response = client.patch(
        f"/reflections/{test_reflection.id}",
        json={
            "reflection_type": "evening",
            "content": "test content after update",
            "date": "2026-03-17",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert response.json()["reflection_type"] == "evening"
    assert response.json()["content"] == "test content after update"


def test_update_reflection_not_found(client):
    # update non existing reflection
    response = client.patch(
        f"/reflections/{uuid.uuid4()}",
        json={"reflection_type": "evening"},
    )
    assert response.status_code == 404


def test_delete_reflection(client, test_reflection):
    # delete reflection
    response = client.delete(f"/reflections/{test_reflection.id}")

    assert response.status_code == 204


def test_delete_reflection_not_found(client):
    # delete non existing reflection
    response = client.delete(f"/reflections/{uuid.uuid4()}")
    assert response.status_code == 404
