import { useState, useEffect } from 'react'
import { api } from './api/client'
import type { Document } from './api/types'
import { UploadZone } from './components/UploadZone'
import { DocumentList } from './components/DocumentList'
import { ChatPanel } from './components/ChatPanel'

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.documents.list()
      .then(setDocuments)
      .finally(() => setLoading(false))
  }, [])

  function handleUploaded(doc: Document) {
    setDocuments((prev) => [doc, ...prev])
  }

  function handleDeleted(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">
          📚 Semantic Doc Intelligence
        </h1>
        <p className="text-slate-400 text-sm">Upload documents, ask questions, get cited answers.</p>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — documents */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Documents</h2>
            <UploadZone onUploaded={handleUploaded} />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-slate-400 text-sm text-center py-6">Loading…</p>
            ) : (
              <DocumentList documents={documents} onDeleted={handleDeleted} />
            )}
          </div>
        </aside>

        {/* Right — chat */}
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <ChatPanel />
        </main>
      </div>
    </div>
  )
}
