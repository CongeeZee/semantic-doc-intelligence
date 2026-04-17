export interface Document {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  created_at: string
}

export interface Citation {
  index: number
  document_id: string
  filename: string
  chunk_index: number
  score: number
  excerpt: string
}

export interface QueryResponse {
  answer: string
  citations: Citation[]
}
