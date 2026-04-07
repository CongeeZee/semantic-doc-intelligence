import re
from typing import List
from app.config import settings


def chunk_text(text: str, chunk_size: int | None = None, chunk_overlap: int | None = None) -> List[str]:
    """
    Split text into overlapping chunks, respecting sentence boundaries where possible.

    Strategy:
    1. Split into sentences.
    2. Accumulate sentences into a chunk until chunk_size is reached.
    3. Slide forward by (chunk_size - chunk_overlap) tokens, keeping the tail for context.
    """
    size = chunk_size or settings.chunk_size
    overlap = chunk_overlap or settings.chunk_overlap

    sentences = _split_sentences(text)
    chunks: List[str] = []
    current_tokens: List[str] = []
    current_len = 0

    for sentence in sentences:
        words = sentence.split()
        word_count = len(words)

        if current_len + word_count > size and current_tokens:
            chunks.append(" ".join(current_tokens))
            # keep overlap worth of tokens from the tail
            overlap_tokens = current_tokens[-overlap:] if overlap else []
            current_tokens = overlap_tokens + words
            current_len = len(current_tokens)
        else:
            current_tokens.extend(words)
            current_len += word_count

    if current_tokens:
        chunks.append(" ".join(current_tokens))

    return [c for c in chunks if c.strip()]


def _split_sentences(text: str) -> List[str]:
    """Naive sentence splitter — good enough without NLTK dependency."""
    text = re.sub(r"\s+", " ", text).strip()
    # Split on . ! ? followed by whitespace and a capital letter or end of string
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)
    return [p.strip() for p in parts if p.strip()]
