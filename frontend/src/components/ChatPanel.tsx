import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Citation } from '../api/types'
import { CitationCard } from './CitationCard'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  citations?: Citation[]
  streaming?: boolean
  error?: string
  timestamp: number
}

interface Props {
  hasDocuments: boolean
}

const SUGGESTIONS = [
  'Summarize the key points from my documents',
  'What are the main themes discussed?',
  'Find any dates, deadlines, or timelines mentioned',
  'Compare and contrast the different perspectives',
]

export function ChatPanel({ hasDocuments }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const idRef = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }, [input])

  const updateMessage = useCallback((id: number, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  async function handleSubmit(question: string) {
    const q = question.trim()
    if (!q || loading) return

    setInput('')
    setLoading(true)

    const userMsg: Message = { id: idRef.current++, role: 'user', text: q, timestamp: Date.now() }
    const assistantId = idRef.current++
    const assistantMsg: Message = { id: assistantId, role: 'assistant', text: '', streaming: true, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg, assistantMsg])

    try {
      const res = await fetch('/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, top_k: 5 }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`${res.status}: ${body}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: { type: string; content?: string; citations?: Citation[] }
          try {
            event = JSON.parse(raw)
          } catch {
            continue
          }

          if (event.type === 'token' && event.content) {
            fullText += event.content
            updateMessage(assistantId, { text: fullText })
          } else if (event.type === 'citations') {
            updateMessage(assistantId, { citations: event.citations, streaming: false })
          }
        }
      }

      updateMessage(assistantId, { streaming: false })
    } catch (err) {
      updateMessage(assistantId, {
        text: '',
        streaming: false,
        error: err instanceof Error ? err.message : 'Query failed',
      })
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSubmit(input)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(input)
    }
  }

  function clearChat() {
    setMessages([])
    idRef.current = 0
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-surface-0">
      {/* Top bar */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-surface-1/50">
          <span className="text-text-tertiary text-xs">
            {messages.filter(m => m.role === 'user').length} question{messages.filter(m => m.role === 'user').length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearChat}
            className="text-text-tertiary hover:text-text-secondary text-xs flex items-center gap-1 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear chat
          </button>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in">
            <div className="max-w-md text-center">
              {/* Logo icon */}
              <div className="w-14 h-14 rounded-2xl bg-accent-muted mx-auto mb-5 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="13" y2="13" />
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-text-primary mb-1.5">
                Ask about your documents
              </h2>
              <p className="text-text-tertiary text-sm leading-relaxed mb-8">
                {hasDocuments
                  ? 'Your sources are ready. Ask any question and get precise, cited answers.'
                  : 'Upload documents in the sidebar, then ask questions to get precise, cited answers.'
                }
              </p>

              {/* Suggestion chips */}
              {hasDocuments && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSubmit(s)}
                      className="text-left text-xs text-text-secondary bg-surface-2 hover:bg-surface-3 border border-border hover:border-border-light rounded-xl px-3.5 py-2.5 transition-all"
                    >
                      <span className="text-accent mr-1.5">&#8594;</span>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-accent/15 border border-accent/20 text-text-primary rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%] text-sm leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* AI avatar + response */}
                    <div className="flex gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        {msg.error ? (
                          <div className="bg-error-muted border border-error/20 rounded-xl px-4 py-3 text-error text-sm">
                            {msg.error}
                          </div>
                        ) : (
                          <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-md px-4 py-3 text-sm text-text-primary leading-relaxed">
                            <div className="prose-chat">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                            {msg.streaming && (
                              <span className="inline-block w-1.5 h-4 ml-0.5 bg-accent rounded-sm animate-pulse-glow align-text-bottom" />
                            )}
                          </div>
                        )}

                        {/* Citations */}
                        {!msg.streaming && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-widest mb-2 px-1">
                              Sources
                            </p>
                            <div className="space-y-1.5">
                              {msg.citations.map((c) => (
                                <CitationCard key={c.index} citation={c} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3 animate-fade-in">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="flex gap-1.5 items-center px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-surface-1/50 px-5 py-3">
        <form onSubmit={onFormSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end bg-surface-2 border border-border rounded-2xl px-4 py-2.5 focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={hasDocuments ? 'Ask about your documents...' : 'Upload documents first...'}
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent text-text-primary text-sm placeholder-text-tertiary outline-none resize-none max-h-40 leading-relaxed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-center text-text-tertiary text-[10px] mt-2">
            <kbd className="bg-surface-3 px-1 py-0.5 rounded text-text-secondary border border-border text-[10px]">Ctrl</kbd>
            {' + '}
            <kbd className="bg-surface-3 px-1 py-0.5 rounded text-text-secondary border border-border text-[10px]">Enter</kbd>
            {' to send'}
          </p>
        </form>
      </div>
    </div>
  )
}
