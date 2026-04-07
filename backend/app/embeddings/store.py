from typing import List
import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from app.config import settings


class VectorStore:
    def __init__(self):
        self._client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._model = SentenceTransformer(settings.embed_model)
        self._collection = self._client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(self, chunks: List[str], doc_id: str) -> List[str]:
        """Embed and store chunks. Returns the list of chroma IDs assigned."""
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        embeddings = self._model.encode(chunks, show_progress_bar=False).tolist()
        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=[{"document_id": doc_id, "chunk_index": i} for i in range(len(chunks))],
        )
        return ids

    def query(self, query_text: str, top_k: int | None = None) -> List[dict]:
        """Return top-k most similar chunks with metadata and distances."""
        k = top_k or settings.top_k
        embedding = self._model.encode([query_text], show_progress_bar=False).tolist()
        results = self._collection.query(
            query_embeddings=embedding,
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )
        chunks = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            chunks.append({"text": doc, "metadata": meta, "distance": dist})
        return chunks

    def delete_document(self, doc_id: str):
        """Remove all chunks belonging to a document."""
        self._collection.delete(where={"document_id": doc_id})


# Module-level singleton — instantiated on first import
_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
