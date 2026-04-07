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
    if (!ACCEPTED_MIME.has(file.type)) {
      setError(`Unsupported file type: ${file.type || file.name.split('.').pop()}`)
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
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${dragging ? 'border-violet-500 bg-violet-50' : 'border-slate-300 hover:border-violet-400 hover:bg-slate-50'}
        ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
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

      <div className="text-4xl mb-3">{uploading ? '⏳' : '📄'}</div>
      <p className="text-slate-700 font-medium">
        {uploading ? 'Uploading & processing…' : 'Drop a file or click to browse'}
      </p>
      <p className="text-slate-400 text-sm mt-1">PDF, DOCX, TXT supported</p>

      {error && (
        <p className="mt-3 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
