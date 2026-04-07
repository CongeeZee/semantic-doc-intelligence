import os
import tempfile
import pytest
from app.ingestion.parser import parse_document


def test_parse_txt_file():
    with tempfile.NamedTemporaryFile(suffix=".txt", mode="w", delete=False, encoding="utf-8") as f:
        f.write("Hello, this is a test document.\nSecond line here.")
        path = f.name

    try:
        text = parse_document(path, "text/plain")
        assert "Hello" in text
        assert "Second line" in text
    finally:
        os.unlink(path)


def test_parse_unsupported_type():
    with pytest.raises(ValueError, match="Unsupported file type"):
        parse_document("file.xyz", "application/octet-stream")
