import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import type { QueryResponse } from '../api/types'
import { CitationCard } from './CitationCard'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  response?: QueryResponse
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    setError(null)

    const userMsg: Message = { id: idRef.current++, role: 'user', text: question }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await api.query(question)
      const assistantMsg: Message = {
        id: idRef.current++,
        role: 'assistant',
        text: response.answer,
        response,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        {messages.length === 0 && (
          <p className="text-slate-400 text-sm text-center pt-10">
            Ask a question about your uploaded documents.
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : ''}>
            {msg.role === 'user' ? (
              <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm">
                {msg.text}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-w-[90%]">
                  {msg.text}
                </div>
                {msg.response && msg.response.citations.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Sources</p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.response.citations.map((c) => (
                        <CitationCard key={c.index} citation={c} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-1.5 px-4 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-slate-100">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          disabled={loading}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
