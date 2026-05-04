import pytest
from services.conversation import _is_text_file


@pytest.mark.parametrize("filename,mime_type,expected", [
    ("doc.txt", "text/plain", True),
    ("notes.md", "text/markdown", True),
    ("notes.md", "application/octet-stream", True),
    ("readme.markdown", "application/octet-stream", True),
    ("notes.md", None, True),
    ("notes.md", "", True),
    ("report.pdf", "application/pdf", False),
    ("photo.png", "image/png", False),
    ("archive.zip", "application/zip", False),
    ("", "application/octet-stream", False),
    (None, "application/octet-stream", False),
])
def test_is_text_file(filename, mime_type, expected):
    assert _is_text_file(filename, mime_type) is expected
