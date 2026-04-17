from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.document import Document
from app.retrieval.search import retrieve_chunks
from app.synthesis.answerer import synthesize_answer, stream_answer

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5


def _enrich_with_filenames(chunks: list, db: Session) -> list:
    """Attach document filename to each chunk's metadata."""
    doc_ids = {c["metadata"]["document_id"] for c in chunks}
    docs = db.query(Document).filter(Document.id.in_(doc_ids)).all()
    name_map = {str(d.id): d.filename for d in docs}
    for c in chunks:
        c["metadata"]["filename"] = name_map.get(c["metadata"]["document_id"], "Unknown")
    return chunks


@router.post("/")
def query_documents(req: QueryRequest, db: Session = Depends(get_db)):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")

    chunks = retrieve_chunks(req.question, top_k=req.top_k)
    chunks = _enrich_with_filenames(chunks, db)
    return synthesize_answer(req.question, chunks)


@router.post("/stream")
def stream_query(req: QueryRequest, db: Session = Depends(get_db)):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")

    chunks = retrieve_chunks(req.question, top_k=req.top_k)
    chunks = _enrich_with_filenames(chunks, db)

    return StreamingResponse(
        stream_answer(req.question, chunks),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
