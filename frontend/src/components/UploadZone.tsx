import { useRef, useState } from 'react'
import { api } from '../api/client'
import type { Document } from '../api/types'

interface Props {
  onUploaded: (doc: Document) => void
}

const ACCEPTED = '.pdf,.docx,.doc,.txt'
const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
])

export function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!ACCEPTED_MIME.has(file.type) && !ACCEPTED.split(',').some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError(`Unsupported file type: ${file.name.split('.').pop()}`)
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50 MB)')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const doc = await api.documents.upload(file)
      onUploaded(doc)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? 'border-accent bg-accent-muted scale-[1.02]'
            : 'border-border-light hover:border-accent hover:bg-accent-muted-2'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={onInputChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-text-secondary text-xs font-medium">Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-text-secondary text-xs font-medium">Add source</span>
            <span className="text-text-tertiary text-[10px]">PDF, DOCX, TXT</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-2 animate-fade-in">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-error text-[11px]">{error}</p>
        </div>
      )}
    </div>
  )
}
