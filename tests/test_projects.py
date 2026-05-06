import uuid
from models.projects import Project


def test_create_project(client, test_user):
    response = client.post(
        "/projects/",
        json={"name": "My Project"},
        params={"user_id": str(test_user.id)},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "My Project"


def test_list_projects(client, test_user, db_session):
    for name in ("Project A", "Project B"):
        db_session.add(Project(user_id=test_user.id, name=name))
    db_session.commit()

    response = client.get("/projects/", params={"user_id": str(test_user.id)})
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_project(client, test_user, test_project):
    response = client.get(
        f"/projects/{test_project.id}",
        params={"user_id": str(test_user.id)},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Project"


def test_get_project_not_found(client, test_user):
    response = client.get(
        f"/projects/{uuid.uuid4()}",
        params={"user_id": str(test_user.id)},
    )
    assert response.status_code == 404


def test_delete_project(client, test_user, test_project):
    response = client.delete(
        f"/projects/{test_project.id}",
        params={"user_id": str(test_user.id)},
    )
    assert response.status_code == 204

    response = client.get(
        f"/projects/{test_project.id}",
        params={"user_id": str(test_user.id)},
    )
    assert response.status_code == 404


def test_delete_project_not_found(client, test_user):
    response = client.delete(
        f"/projects/{uuid.uuid4()}",
        params={"user_id": str(test_user.id)},
    )
    assert response.status_code == 404
