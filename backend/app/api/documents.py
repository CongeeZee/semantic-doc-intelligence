import os
import uuid
import aiofiles
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.models.database import get_db, SessionLocal
from app.models.document import Document
from app.ingestion.pipeline import ingest_document
from app.config import settings

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
}


def _ingest_in_background(doc_id: str) -> None:
    """Run ingestion with its own DB session so it outlives the request."""
    db = SessionLocal()
    try:
        ingest_document(db, doc_id)
    finally:
        db.close()


@router.post("/upload", status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    os.makedirs(settings.upload_dir, exist_ok=True)
    doc_id = uuid.uuid4()
    ext = os.path.splitext(file.filename or "file")[1]
    file_path = os.path.join(settings.upload_dir, f"{doc_id}{ext}")

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    doc = Document(
        id=doc_id,
        filename=file.filename,
        content_type=file.content_type,
        file_path=file_path,
        status="pending",
    )
    db.add(doc)
    db.commit()

    # Return immediately; ingestion runs in the background
    background_tasks.add_task(_ingest_in_background, str(doc_id))

    return {"id": str(doc.id), "filename": doc.filename, "status": doc.status, "created_at": doc.created_at.isoformat() if doc.created_at else None}


@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [
        {"id": str(d.id), "filename": d.filename, "status": d.status, "created_at": d.created_at.isoformat() if d.created_at else None}
        for d in docs
    ]


@router.get("/{doc_id}")
def get_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"id": str(doc.id), "filename": doc.filename, "status": doc.status, "created_at": doc.created_at.isoformat() if doc.created_at else None}


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from vector store
    from app.embeddings.store import get_vector_store
    get_vector_store().delete_document(doc_id)

    # Remove file
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
