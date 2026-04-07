from typing import List
import anthropic
from app.config import settings


_SYSTEM_PROMPT = """You are a document assistant. Answer the user's question using ONLY the provided context passages.

Rules:
- Cite every claim with [1], [2], etc. corresponding to the passage numbers below.
- If the context does not contain enough information, say so — do not hallucinate.
- Be concise and factual."""


def synthesize_answer(query: str, chunks: List[dict]) -> dict:
    """
    Call Claude to generate a cited answer from retrieved chunks.
    Returns: { answer: str, citations: list[dict] }
    """
    if not chunks:
        return {"answer": "No relevant passages were found for your query.", "citations": []}

    context_block = "\n\n".join(
        f"[{i + 1}] (doc: {c['metadata']['document_id']}, chunk: {c['metadata']['chunk_index']})\n{c['text']}"
        for i, c in enumerate(chunks)
    )

    user_message = f"Context passages:\n\n{context_block}\n\n---\nQuestion: {query}"

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    answer_text = message.content[0].text

    citations = [
        {
            "index": i + 1,
            "document_id": c["metadata"]["document_id"],
            "chunk_index": c["metadata"]["chunk_index"],
            "score": c["score"],
            "excerpt": c["text"][:200] + ("..." if len(c["text"]) > 200 else ""),
        }
        for i, c in enumerate(chunks)
    ]

    return {"answer": answer_text, "citations": citations}
