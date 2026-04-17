import type { Document, QueryResponse } from './types'

const BASE = ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  documents: {
    list: (): Promise<Document[]> =>
      request('/documents/'),

    get: (id: string): Promise<Document> =>
      request(`/documents/${id}`),

    upload: (file: File): Promise<Document> => {
      const form = new FormData()
      form.append('file', file)
      return request('/documents/upload', { method: 'POST', body: form })
    },

    delete: (id: string): Promise<void> =>
      request(`/documents/${id}`, { method: 'DELETE' }),
  },

  query: (question: string, top_k = 5): Promise<QueryResponse> =>
    request('/query/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, top_k }),
    }),
}
