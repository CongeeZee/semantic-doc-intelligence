import { useState } from 'react'
import { api } from '../api/client'
import type { Document } from '../api/types'

interface Props {
  documents: Document[]
  onDeleted: (id: string) => void
}

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-slate-100 text-slate-500',
  failed: 'bg-red-100 text-red-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function DocumentList({ documents, onDeleted }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await api.documents.delete(id)
      onDeleted(id)
    } catch {
      // keep in list on failure
    } finally {
      setDeleting(null)
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-6">
        No documents yet. Upload one above to get started.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">📎</span>
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">{doc.filename}</p>
              <p className="text-slate-400 text-xs">{formatDate(doc.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[doc.status] ?? ''}`}>
              {doc.status}
            </span>
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deleting === doc.id}
              className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Delete document"
            >
              {deleting === doc.id ? '…' : '✕'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
