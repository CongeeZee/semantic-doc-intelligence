from typing import List
from app.embeddings.store import get_vector_store
from app.config import settings


def retrieve_chunks(query: str, top_k: int | None = None) -> List[dict]:
    """
    Retrieve the most semantically relevant chunks for a query.
    Returns a list of dicts with keys: text, metadata, distance, score.
    """
    k = top_k or settings.top_k
    store = get_vector_store()
    raw = store.query(query, top_k=k)

    # Convert cosine distance (0=identical, 2=opposite) to a 0–1 relevance score
    for chunk in raw:
        chunk["score"] = round(1 - chunk["distance"] / 2, 4)

    # Sort by score descending
    raw.sort(key=lambda c: c["score"], reverse=True)
    return raw
