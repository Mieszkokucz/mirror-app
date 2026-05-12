import io
import uuid
import zipfile
import pytest
from unittest.mock import patch

from models.files import File


@pytest.fixture
def test_library_file(db_session, test_user, tmp_path):
    content = b"Hello from library file"
    file_path = tmp_path / "test.txt"
    file_path.write_bytes(content)

    db_file = File(
        user_id=test_user.id,
        filename="test.txt",
        storage_path=str(file_path),
        mime_type="text/plain",
        size_bytes=len(content),
        content_hash="abc123",
    )
    db_session.add(db_file)
    db_session.commit()
    db_session.refresh(db_file)
    yield db_file


@pytest.fixture
def test_library_file_md(db_session, test_user, tmp_path):
    content = b"# Markdown heading\nSome content"
    file_path = tmp_path / "notes.md"
    file_path.write_bytes(content)

    db_file = File(
        user_id=test_user.id,
        filename="notes.md",
        storage_path=str(file_path),
        mime_type="application/octet-stream",
        size_bytes=len(content),
        content_hash="def456",
    )
    db_session.add(db_file)
    db_session.commit()
    db_session.refresh(db_file)
    yield db_file


@pytest.fixture
def test_library_file_pdf(db_session, test_user, tmp_path):
    content = b"%PDF fake pdf content"
    file_path = tmp_path / "report.pdf"
    file_path.write_bytes(content)

    db_file = File(
        user_id=test_user.id,
        filename="report.pdf",
        storage_path=str(file_path),
        mime_type="application/pdf",
        size_bytes=len(content),
        content_hash="ghi789",
    )
    db_session.add(db_file)
    db_session.commit()
    db_session.refresh(db_file)
    yield db_file


# --- A. context_file_ids ---

@patch("services.conversation.send_to_llm", return_value="ok")
def test_chat_with_library_file_in_context(mock_llm, client, test_user, test_library_file):
    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "context_file_ids": str(test_library_file.id),
        },
    )
    assert response.status_code == 200
    system_prompt = mock_llm.call_args[1]["system_prompt"]
    assert "[File: test.txt]" in system_prompt
    assert "Hello from library file" in system_prompt


@patch("services.conversation.send_to_llm", return_value="ok")
def test_chat_with_markdown_file_in_context(mock_llm, client, test_user, test_library_file_md):
    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "context_file_ids": str(test_library_file_md.id),
        },
    )
    assert response.status_code == 200
    system_prompt = mock_llm.call_args[1]["system_prompt"]
    assert "[File: notes.md]" in system_prompt
    assert "Markdown heading" in system_prompt


@patch("services.conversation.send_to_llm", return_value="ok")
def test_chat_with_invalid_file_id(mock_llm, client, test_user):
    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "context_file_ids": str(uuid.uuid4()),
        },
    )
    assert response.status_code == 404


@patch("services.conversation.send_to_llm", return_value="ok")
def test_chat_with_unsupported_file_type_in_context(mock_llm, client, test_user, test_library_file_pdf):
    response = client.post(
        "/chat/",
        data={
            "message": "hi",
            "user_id": str(test_user.id),
            "context_file_ids": str(test_library_file_pdf.id),
        },
    )
    assert response.status_code == 422


# --- B. Direct file upload ---

@patch("services.conversation.send_to_llm", return_value="ok")
def test_chat_with_direct_txt_upload(mock_llm, client, test_user):
    response = client.post(
        "/chat/",
        data={"message": "hi", "user_id": str(test_user.id)},
        files=[("files", ("inline.txt", b"inline content", "text/plain"))],
    )
    assert response.status_code == 200
    messages = mock_llm.call_args[0][0]
    user_message = messages[0]["content"]
    assert "[File: inline.txt]" in user_message
    assert "inline content" in user_message


@patch("services.conversation.send_to_llm", return_value="ok")
def test_chat_with_direct_md_upload(mock_llm, client, test_user):
    response = client.post(
        "/chat/",
        data={"message": "hi", "user_id": str(test_user.id)},
        files=[("files", ("notes.md", b"# Title\nBody text", "application/octet-stream"))],
    )
    assert response.status_code == 200
    messages = mock_llm.call_args[0][0]
    user_message = messages[0]["content"]
    assert "[File: notes.md]" in user_message
    assert "Body text" in user_message


@patch("services.conversation.send_to_llm", return_value="ok")
def test_chat_with_direct_unsupported_file(mock_llm, client, test_user):
    response = client.post(
        "/chat/",
        data={"message": "hi", "user_id": str(test_user.id)},
        files=[("files", ("app.exe", b"\x4d\x5a binary", "application/octet-stream"))],
    )
    assert response.status_code == 422


# --- C. Historyczne pliki ---

@patch("services.conversation.send_to_llm", return_value="ok")
def test_historic_files_included_in_next_message(mock_llm, client, test_user, test_library_file):
    # Pierwsza wiadomość z plikiem
    resp1 = client.post(
        "/chat/",
        data={
            "message": "first",
            "user_id": str(test_user.id),
            "context_file_ids": str(test_library_file.id),
        },
    )
    assert resp1.status_code == 200
    session_id = resp1.json()["session_id"]

    # Druga wiadomość bez pliku — plik powinien pojawić się jako historyczny
    resp2 = client.post(
        "/chat/",
        data={
            "message": "second",
            "user_id": str(test_user.id),
            "session_id": session_id,
        },
    )
    assert resp2.status_code == 200
    system_prompt = mock_llm.call_args[1]["system_prompt"]
    assert "Previously attached files" in system_prompt
    assert "Hello from library file" in system_prompt


# --- D. Endpointy /files/library ---

def test_upload_library_file(client, test_user):
    response = client.post(
        "/files/library",
        params={"user_id": str(test_user.id)},
        files={"file": ("doc.txt", b"file content", "text/plain")},
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["filename"] == "doc.txt"
    assert data["mime_type"] == "text/plain"


def test_upload_markdown_to_library(client, test_user):
    response = client.post(
        "/files/library",
        params={"user_id": str(test_user.id)},
        files={"file": ("notes.md", b"# Hello", "application/octet-stream")},
    )
    assert response.status_code == 201
    assert response.json()["filename"] == "notes.md"


def test_list_library_files(client, test_user, test_library_file):
    response = client.get("/files/library", params={"user_id": str(test_user.id)})
    assert response.status_code == 200
    ids = [f["id"] for f in response.json()]
    assert str(test_library_file.id) in ids


def test_list_library_files_filter_by_project(client, db_session, test_user, test_project, tmp_path):
    content = b"project file"
    file_path = tmp_path / "proj.txt"
    file_path.write_bytes(content)

    file_with_project = File(
        user_id=test_user.id,
        filename="proj.txt",
        storage_path=str(file_path),
        mime_type="text/plain",
        size_bytes=len(content),
        content_hash="proj_hash",
        project_id=test_project.id,
    )
    file_without_project = File(
        user_id=test_user.id,
        filename="other.txt",
        storage_path=str(tmp_path / "other.txt"),
        mime_type="text/plain",
        size_bytes=5,
        content_hash="other_hash",
    )
    db_session.add(file_with_project)
    db_session.add(file_without_project)
    db_session.commit()
    db_session.refresh(file_with_project)

    response = client.get(
        "/files/library",
        params={"user_id": str(test_user.id), "project_id": str(test_project.id)},
    )
    assert response.status_code == 200
    ids = [f["id"] for f in response.json()]
    assert str(file_with_project.id) in ids
    assert len(ids) == 1


def test_delete_library_file(client, test_user, test_library_file):
    response = client.delete(f"/files/library/{test_library_file.id}")
    assert response.status_code == 204

    list_response = client.get("/files/library", params={"user_id": str(test_user.id)})
    ids = [f["id"] for f in list_response.json()]
    assert str(test_library_file.id) not in ids


def test_export_library_files_as_zip(client, db_session, test_user, test_project, tmp_path):
    content = b"hello world"
    file_path = tmp_path / "export_doc.txt"
    file_path.write_bytes(content)

    db_file = File(
        user_id=test_user.id,
        filename="export_doc.txt",
        storage_path=str(file_path),
        mime_type="text/plain",
        size_bytes=len(content),
        content_hash="abc123",
        project_id=test_project.id,
    )
    db_session.add(db_file)
    db_session.commit()

    response = client.get(
        "/files/library/export",
        params={"user_id": str(test_user.id), "project_id": str(test_project.id)},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert "attachment" in response.headers["content-disposition"]

    zf = zipfile.ZipFile(io.BytesIO(response.content))
    assert "export_doc.txt" in zf.namelist()
    assert zf.read("export_doc.txt") == content


def test_export_library_files_404_when_empty(client, test_user, test_project):
    response = client.get(
        "/files/library/export",
        params={"user_id": str(test_user.id), "project_id": str(test_project.id)},
    )
    assert response.status_code == 404


def test_export_library_files_deduplicates_filenames(client, db_session, test_user, test_project, tmp_path):
    content_a = b"file one"
    content_b = b"file two"
    content_c = b"file three"

    for i, content in enumerate([content_a, content_b, content_c]):
        p = tmp_path / f"real_{i}.txt"
        p.write_bytes(content)
        db_session.add(File(
            user_id=test_user.id,
            filename="raport.txt",
            storage_path=str(p),
            mime_type="text/plain",
            size_bytes=len(content),
            content_hash=f"hash{i}",
            project_id=test_project.id,
        ))
    db_session.commit()

    response = client.get(
        "/files/library/export",
        params={"user_id": str(test_user.id), "project_id": str(test_project.id)},
    )
    assert response.status_code == 200

    zf = zipfile.ZipFile(io.BytesIO(response.content))
    names = zf.namelist()
    assert "raport.txt" in names
    assert "raport_1.txt" in names
    assert "raport_2.txt" in names
    assert len(names) == 3


def test_export_library_files_no_project(client, db_session, test_user, tmp_path):
    content = b"no project file"
    file_path = tmp_path / "noproj.txt"
    file_path.write_bytes(content)
    db_session.add(File(
        user_id=test_user.id,
        filename="noproj.txt",
        storage_path=str(file_path),
        mime_type="text/plain",
        size_bytes=len(content),
        content_hash="noproj_hash",
        project_id=None,
    ))
    db_session.commit()

    response = client.get("/files/library/export", params={"user_id": str(test_user.id)})
    assert response.status_code == 200
    zf = zipfile.ZipFile(io.BytesIO(response.content))
    assert "noproj.txt" in zf.namelist()
