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


def test_get_reflections_list_by_date(client, test_user):
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

    response = client.get(
        "/reflections/", params={"user_id": str(test_user.id), "date": "2026-03-18"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["reflection_type"] == "evening"
    assert response.json()[0]["content"] == "testcontent2"


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


def test_export_reflections(client, test_user):
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "morning",
            "content": "morning thoughts",
            "date": "2026-03-17",
        },
    )
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "evening",
            "content": "evening thoughts",
            "date": "2026-03-17",
        },
    )

    response = client.get(
        "/reflections/export", params={"user_id": str(test_user.id)}
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; charset=utf-8"
    assert "filename=reflections_export.txt" in response.headers["content-disposition"]

    text = response.text
    assert "morning thoughts" in text
    assert "evening thoughts" in text
    assert "Date: 2026-03-17" in text
    assert "Type: morning" in text
    assert "Type: evening" in text


def test_export_reflections_with_date_from(client, test_user):
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "morning",
            "content": "old thoughts",
            "date": "2026-03-10",
        },
    )
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "morning",
            "content": "recent thoughts",
            "date": "2026-03-20",
        },
    )

    response = client.get(
        "/reflections/export",
        params={"user_id": str(test_user.id), "date_from": "2026-03-15"},
    )

    assert response.status_code == 200
    assert "filename=reflections_export_from_2026-03-15.txt" in response.headers["content-disposition"]
    assert "recent thoughts" in response.text
    assert "old thoughts" not in response.text


def test_export_reflections_with_date_to(client, test_user):
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "morning",
            "content": "old thoughts",
            "date": "2026-03-10",
        },
    )
    client.post(
        "/reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "morning",
            "content": "recent thoughts",
            "date": "2026-03-20",
        },
    )

    response = client.get(
        "/reflections/export",
        params={"user_id": str(test_user.id), "date_to": "2026-03-15"},
    )

    assert response.status_code == 200
    assert "filename=reflections_export_to_2026-03-15.txt" in response.headers["content-disposition"]
    assert "old thoughts" in response.text
    assert "recent thoughts" not in response.text


def test_export_reflections_with_date_range(client, test_user):
    for date, content in [
        ("2026-03-05", "too early"),
        ("2026-03-15", "in range"),
        ("2026-03-25", "too late"),
    ]:
        client.post(
            "/reflections/",
            json={
                "user_id": str(test_user.id),
                "reflection_type": "morning",
                "content": content,
                "date": date,
            },
        )

    response = client.get(
        "/reflections/export",
        params={
            "user_id": str(test_user.id),
            "date_from": "2026-03-10",
            "date_to": "2026-03-20",
        },
    )

    assert response.status_code == 200
    assert "filename=reflections_export_2026-03-10_to_2026-03-20.txt" in response.headers["content-disposition"]
    assert "in range" in response.text
    assert "too early" not in response.text
    assert "too late" not in response.text


def test_export_reflections_empty(client, test_user):
    response = client.get(
        "/reflections/export", params={"user_id": str(test_user.id)}
    )
    assert response.status_code == 404


def test_create_periodic_reflection(client, test_user):
    response = client.post(
        "/periodic-reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "weekly",
            "content": "weekly summary",
            "date_from": "2026-03-10",
            "date_to": "2026-03-16",
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_periodic_reflections_list(client, test_user):
    client.post(
        "/periodic-reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "weekly",
            "content": "week one",
            "date_from": "2026-03-10",
            "date_to": "2026-03-16",
        },
    )
    client.post(
        "/periodic-reflections/",
        json={
            "user_id": str(test_user.id),
            "reflection_type": "monthly",
            "content": "march summary",
            "date_from": "2026-03-01",
            "date_to": "2026-03-31",
        },
    )

    response = client.get("/periodic-reflections/", params={"user_id": str(test_user.id)})

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_periodic_reflection_by_id(client, test_periodic_reflection):
    response = client.get(f"/periodic-reflections/{test_periodic_reflection.id}")

    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert response.json()["reflection_type"] == "weekly"
    assert response.json()["content"] == "test periodic"
    assert response.json()["date_from"] == "2026-03-10"
    assert response.json()["date_to"] == "2026-03-16"


def test_get_periodic_reflection_by_id_not_found(client):
    response = client.get(f"/periodic-reflections/{uuid.uuid4()}")
    assert response.status_code == 404


def test_update_periodic_reflection(client, test_periodic_reflection):
    response = client.patch(
        f"/periodic-reflections/{test_periodic_reflection.id}",
        json={
            "content": "updated periodic content",
            "reflection_type": "monthly",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert response.json()["content"] == "updated periodic content"
    assert response.json()["reflection_type"] == "monthly"


def test_update_periodic_reflection_not_found(client):
    response = client.patch(
        f"/periodic-reflections/{uuid.uuid4()}",
        json={"content": "no such reflection"},
    )
    assert response.status_code == 404


def test_delete_periodic_reflection(client, test_periodic_reflection):
    response = client.delete(f"/periodic-reflections/{test_periodic_reflection.id}")
    assert response.status_code == 204


def test_delete_periodic_reflection_not_found(client):
    response = client.delete(f"/periodic-reflections/{uuid.uuid4()}")
    assert response.status_code == 404
