import os
import uuid
from sqlalchemy.orm import Session
from app.models.document import Document, Chunk
from app.ingestion.parser import parse_document
from app.ingestion.chunker import chunk_text
from app.embeddings.store import get_vector_store
from app.config import settings


def ingest_document(db: Session, doc_id: str) -> None:
    """
    Full ingestion pipeline for a document that has already been saved to disk.
    Steps: parse → chunk → embed → persist chunk records.
    """
    doc: Document = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise ValueError(f"Document {doc_id} not found")

    doc.status = "processing"
    db.commit()

    try:
        # 1. Parse
        text = parse_document(doc.file_path, doc.content_type)

        # 2. Chunk
        chunks = chunk_text(text)
        if not chunks:
            raise ValueError("No text could be extracted from the document")

        # 3. Embed & store in Chroma
        store = get_vector_store()
        chroma_ids = store.add_chunks(chunks, str(doc.id))

        # 4. Persist chunk records in Postgres
        for i, (chunk_text_val, chroma_id) in enumerate(zip(chunks, chroma_ids)):
            db.add(Chunk(
                document_id=doc.id,
                chunk_index=i,
                text=chunk_text_val,
                chroma_id=chroma_id,
            ))

        doc.status = "ready"
        db.commit()

    except Exception as exc:
        doc.status = "failed"
        db.commit()
        raise exc
