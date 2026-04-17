import { useState } from 'react'
import { api } from '../api/client'
import type { Document } from '../api/types'

interface Props {
  documents: Document[]
  onDeleted: (id: string) => void
}

const FILE_ICONS: Record<string, string> = {
  pdf: 'M7 21h10a2 2 0 0 0 2-2V9l-5-5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2zM13 4l5 5h-5V4z',
  docx: 'M7 21h10a2 2 0 0 0 2-2V9l-5-5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2zM13 4l5 5h-5V4z',
  txt: 'M7 21h10a2 2 0 0 0 2-2V9l-5-5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2zM13 4l5 5h-5V4z',
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  ready: { color: 'text-success', bg: 'bg-success-muted', label: 'Ready' },
  processing: { color: 'text-warning', bg: 'bg-warning-muted', label: 'Processing' },
  pending: { color: 'text-text-tertiary', bg: 'bg-surface-3', label: 'Pending' },
  failed: { color: 'text-error', bg: 'bg-error-muted', label: 'Failed' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getFileExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function FileIcon({ filename }: { filename: string }) {
  const ext = getFileExt(filename)
  const colors: Record<string, string> = {
    pdf: 'text-red-400',
    docx: 'text-blue-400',
    doc: 'text-blue-400',
    txt: 'text-text-tertiary',
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={colors[ext] ?? 'text-text-tertiary'}>
      <path d={FILE_ICONS[ext] ?? FILE_ICONS.txt} />
    </svg>
  )
}

export function DocumentList({ documents, onDeleted }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
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
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary opacity-40">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p className="text-text-tertiary text-xs leading-relaxed">
          No sources yet.<br />Upload documents to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => {
        const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending
        const isProcessing = doc.status === 'processing' || doc.status === 'pending'
        return (
          <div
            key={doc.id}
            className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-2 transition-colors animate-fade-in"
          >
            <div className="shrink-0">
              <FileIcon filename={doc.filename} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-text-primary text-xs font-medium truncate leading-tight" title={doc.filename}>
                {doc.filename}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`flex items-center gap-1 text-[10px] font-medium ${status.color}`}>
                  {isProcessing && (
                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse-glow" />
                  )}
                  {doc.status === 'ready' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  )}
                  {doc.status === 'failed' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  )}
                  {status.label}
                </span>
                <span className="text-text-tertiary text-[10px]">{formatDate(doc.created_at)}</span>
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, doc.id)}
              disabled={deleting === doc.id}
              className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-surface-4 transition-all text-text-tertiary hover:text-error disabled:opacity-50"
              title="Remove source"
            >
              {deleting === doc.id ? (
                <div className="w-3 h-3 border border-text-tertiary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
