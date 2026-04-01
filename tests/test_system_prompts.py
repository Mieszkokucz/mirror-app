import uuid


def test_create_system_prompt(client, test_user):
    response = client.post(
        "/system-prompts/",
        json={
            "user_id": str(test_user.id),
            "name": "my_prompt",
            "display_name": "My Prompt",
            "content": "You are helpful.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "my_prompt"
    assert data["display_name"] == "My Prompt"
    assert data["content"] == "You are helpful."
    assert data["user_id"] == str(test_user.id)


def test_get_system_prompts_list(client, test_user, test_system_prompt, test_builtin_prompt):
    response = client.get(
        "/system-prompts/", params={"user_id": str(test_user.id)}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    names = {p["name"] for p in data}
    assert "test_prompt" in names
    assert "builtin_prompt" in names


def test_get_system_prompt_by_id(client, test_system_prompt):
    response = client.get(f"/system-prompts/{test_system_prompt.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "test_prompt"
    assert data["display_name"] == "Test Prompt"
    assert data["content"] == "You are a test assistant."


def test_get_system_prompt_not_found(client):
    response = client.get(f"/system-prompts/{uuid.uuid4()}")
    assert response.status_code == 404


def test_update_system_prompt(client, test_system_prompt):
    response = client.patch(
        f"/system-prompts/{test_system_prompt.id}",
        json={
            "display_name": "Updated Prompt",
            "content": "Updated content.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "Updated Prompt"
    assert data["content"] == "Updated content."
    assert data["name"] == "test_prompt"


def test_update_system_prompt_not_found(client):
    response = client.patch(
        f"/system-prompts/{uuid.uuid4()}",
        json={"display_name": "Nope"},
    )
    assert response.status_code == 404


def test_delete_system_prompt(client, test_system_prompt):
    response = client.delete(f"/system-prompts/{test_system_prompt.id}")
    assert response.status_code == 204


def test_delete_builtin_system_prompt(client, test_builtin_prompt):
    response = client.delete(f"/system-prompts/{test_builtin_prompt.id}")
    assert response.status_code == 403


def test_delete_system_prompt_not_found(client):
    response = client.delete(f"/system-prompts/{uuid.uuid4()}")
    assert response.status_code == 404
