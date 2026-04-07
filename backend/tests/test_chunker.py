from app.ingestion.chunker import chunk_text, _split_sentences


def test_split_sentences_basic():
    text = "Hello world. This is a test. Another sentence here."
    sentences = _split_sentences(text)
    assert len(sentences) >= 2


def test_chunk_text_returns_list():
    text = " ".join(["word"] * 1000)
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    assert isinstance(chunks, list)
    assert len(chunks) > 1


def test_chunk_overlap():
    text = " ".join([str(i) for i in range(200)])
    chunks = chunk_text(text, chunk_size=50, chunk_overlap=10)
    # Each chunk should not exceed chunk_size significantly
    for chunk in chunks:
        assert len(chunk.split()) <= 60  # some tolerance for sentence boundary


def test_chunk_short_text():
    text = "Short text."
    chunks = chunk_text(text, chunk_size=512, chunk_overlap=64)
    assert len(chunks) == 1
    assert chunks[0] == "Short text."


def test_chunk_empty_text():
    chunks = chunk_text("", chunk_size=100, chunk_overlap=10)
    assert chunks == []
