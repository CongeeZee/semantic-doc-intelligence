import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from './api/client'
import type { Document } from './api/types'
import { UploadZone } from './components/UploadZone'
import { DocumentList } from './components/DocumentList'
import { ChatPanel } from './components/ChatPanel'

const POLL_INTERVAL_MS = 2000

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pollingIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    api.documents.list()
      .then(setDocuments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pollDocument = useCallback((id: string) => {
    if (pollingIds.current.has(id)) return
    pollingIds.current.add(id)

    const interval = setInterval(async () => {
      try {
        const doc = await api.documents.get(id)
        setDocuments((prev) => prev.map((d) => (d.id === id ? doc : d)))
        if (doc.status === 'ready' || doc.status === 'failed') {
          clearInterval(interval)
          pollingIds.current.delete(id)
        }
      } catch {
        clearInterval(interval)
        pollingIds.current.delete(id)
      }
    }, POLL_INTERVAL_MS)
  }, [])

  function handleUploaded(doc: Document) {
    setDocuments((prev) => [doc, ...prev])
    if (doc.status !== 'ready' && doc.status !== 'failed') {
      pollDocument(doc.id)
    }
  }

  function handleDeleted(id: string) {
    pollingIds.current.delete(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const readyCount = documents.filter(d => d.status === 'ready').length

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Header */}
      <header className="bg-surface-1 border-b border-border px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-3 transition-colors text-text-secondary"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarOpen ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary leading-tight">DocIntel</h1>
              <p className="text-[11px] text-text-tertiary leading-tight">Semantic Document Intelligence</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {readyCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface-2 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {readyCount} source{readyCount !== 1 ? 's' : ''} ready
            </div>
          )}
          <div className="text-[11px] text-text-tertiary">
            <kbd className="bg-surface-3 px-1.5 py-0.5 rounded text-text-secondary border border-border">Ctrl</kbd>
            {' + '}
            <kbd className="bg-surface-3 px-1.5 py-0.5 rounded text-text-secondary border border-border">Enter</kbd>
            {' to send'}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — documents */}
        {sidebarOpen && (
          <aside className="w-72 bg-surface-1 border-r border-border flex flex-col overflow-hidden animate-slide-in-left shrink-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sources</h2>
                <span className="text-xs text-text-tertiary">{documents.length}</span>
              </div>
              <UploadZone onUploaded={handleUploaded} />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-text-tertiary text-xs">Loading sources...</p>
                </div>
              ) : (
                <DocumentList documents={documents} onDeleted={handleDeleted} />
              )}
            </div>
          </aside>
        )}

        {/* Right — chat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel hasDocuments={readyCount > 0} />
        </main>
      </div>
    </div>
  )
}
