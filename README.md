# Semantic Document Intelligence Platform

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload documents and ask natural language questions, getting back precise, cited answers grounded in your content.

## What This Project Teaches

- **Document ingestion pipeline** — parse PDFs, Word docs, and plain text; chunk content intelligently
- **Embedding & vector storage** — encode chunks with a sentence transformer and store in a vector database
- **Semantic retrieval** — query by meaning, not keyword; rank and re-rank relevant passages
- **LLM answer synthesis** — pass retrieved context to an LLM and generate cited, grounded answers
- **Full-stack integration** — REST API backend + React frontend with upload UI and chat interface

## Architecture Overview

```
User Upload
    │
    ▼
[Ingestion Service]
  ├── Parse (PDF/DOCX/TXT)
  ├── Chunk (sliding window + sentence boundaries)
  └── Embed (sentence-transformers)
          │
          ▼
   [Vector Store]  ◄──── [Embedding Index]
          │
          ▼
[Retrieval Service]  ◄── User Query
  ├── Query embedding
  ├── ANN search (top-k chunks)
  └── Re-ranking (cross-encoder)
          │
          ▼
[LLM Synthesis]
  ├── Prompt assembly (context + query)
  ├── Answer generation (Claude API)
  └── Citation extraction
          │
          ▼
     [REST API]  ◄──►  [React Frontend]
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python / FastAPI |
| Embeddings | `sentence-transformers` (e.g. `all-MiniLM-L6-v2`) |
| Vector DB | ChromaDB (local dev) / Qdrant (production) |
| LLM | Anthropic Claude API |
| Document parsing | `pypdf`, `python-docx`, `unstructured` |
| Frontend | React + TypeScript + Tailwind CSS |
| Storage | PostgreSQL (metadata) + S3-compatible (raw files) |
| Auth | JWT |

## Project Structure (Planned)

```
semantic-doc-intelligence/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── ingestion/    # Document parsing & chunking
│   │   ├── embeddings/   # Embedding models & vector store client
│   │   ├── retrieval/    # Search, ranking, context assembly
│   │   ├── synthesis/    # LLM prompt building & answer generation
│   │   └── models/       # DB models & schemas
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Upload, Chat, Citation viewer
│   │   └── api/          # API client
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

### Local Setup

```bash
# Clone the repo
git clone <repo-url>
cd semantic-doc-intelligence

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY and other secrets to .env

# Start vector DB and PostgreSQL
docker-compose up -d chroma postgres

# Run the API
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/semdoc
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## Roadmap

- [ ] Document ingestion pipeline (PDF, DOCX, TXT)
- [ ] Chunking strategies (fixed, sentence-aware, semantic)
- [ ] Embedding service + ChromaDB integration
- [ ] Semantic search endpoint
- [ ] LLM synthesis with citation tracking
- [ ] REST API (upload, query, document management)
- [ ] React frontend — upload UI
- [ ] React frontend — chat + citation viewer
- [ ] Re-ranking with cross-encoder
- [ ] Authentication & multi-user document isolation
- [ ] Production deployment (Qdrant, S3, Postgres)

## License

MIT
