from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.retrieval.search import retrieve_chunks
from app.synthesis.answerer import synthesize_answer

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5


@router.post("/")
def query_documents(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")

    chunks = retrieve_chunks(req.question, top_k=req.top_k)
    result = synthesize_answer(req.question, chunks)
    return result
