import io
from pathlib import Path


def parse_document(file_path: str, content_type: str) -> str:
    """Extract plain text from a document based on its content type."""
    path = Path(file_path)

    if content_type == "application/pdf" or path.suffix.lower() == ".pdf":
        return _parse_pdf(path)
    elif content_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ) or path.suffix.lower() in (".docx", ".doc"):
        return _parse_docx(path)
    elif content_type == "text/plain" or path.suffix.lower() == ".txt":
        return path.read_text(encoding="utf-8", errors="replace")
    else:
        raise ValueError(f"Unsupported file type: {content_type} ({path.suffix})")


def _parse_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def _parse_docx(path: Path) -> str:
    from docx import Document

    doc = Document(str(path))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)
