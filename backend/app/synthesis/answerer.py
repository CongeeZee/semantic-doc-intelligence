import json
from typing import Generator, List
import anthropic
from app.config import settings


_SYSTEM_PROMPT = """You are a document assistant. Answer the user's question using ONLY the provided context passages.

Rules:
- Cite every claim with [1], [2], etc. corresponding to the passage numbers below.
- If the context does not contain enough information, say so — do not hallucinate.
- Be concise and factual."""


def _build_context(chunks: List[dict]) -> str:
    return "\n\n".join(
        f"[{i + 1}] (doc: {c['metadata'].get('filename', c['metadata']['document_id'])}, chunk: {c['metadata']['chunk_index']})\n{c['text']}"
        for i, c in enumerate(chunks)
    )


def _build_citations(chunks: List[dict]) -> List[dict]:
    return [
        {
            "index": i + 1,
            "document_id": c["metadata"]["document_id"],
            "filename": c["metadata"].get("filename", "Unknown"),
            "chunk_index": c["metadata"]["chunk_index"],
            "score": c["score"],
            "excerpt": c["text"][:200] + ("..." if len(c["text"]) > 200 else ""),
        }
        for i, c in enumerate(chunks)
    ]


def synthesize_answer(query: str, chunks: List[dict]) -> dict:
    if not chunks:
        return {"answer": "No relevant passages were found for your query.", "citations": []}

    user_message = f"Context passages:\n\n{_build_context(chunks)}\n\n---\nQuestion: {query}"

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    return {"answer": message.content[0].text, "citations": _build_citations(chunks)}


def stream_answer(query: str, chunks: List[dict]) -> Generator[str, None, None]:
    """Yields Server-Sent Events for streaming to the frontend."""
    if not chunks:
        yield f'data: {json.dumps({"type": "token", "content": "No relevant passages were found for your query."})}\n\n'
        yield f'data: {json.dumps({"type": "citations", "citations": []})}\n\n'
        yield 'data: {"type": "done"}\n\n'
        return

    user_message = f"Context passages:\n\n{_build_context(chunks)}\n\n---\nQuestion: {query}"

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        for text in stream.text_stream:
            yield f'data: {json.dumps({"type": "token", "content": text})}\n\n'

    yield f'data: {json.dumps({"type": "citations", "citations": _build_citations(chunks)})}\n\n'
    yield 'data: {"type": "done"}\n\n'
