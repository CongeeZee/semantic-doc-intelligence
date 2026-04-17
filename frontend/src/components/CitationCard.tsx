import { useState } from 'react'
import type { Citation } from '../api/types'

interface Props {
  citation: Citation
}

export function CitationCard({ citation }: Props) {
  const [expanded, setExpanded] = useState(false)
  const scorePercent = Math.round(citation.score * 100)

  const scoreColor =
    scorePercent >= 80 ? 'text-success' :
    scorePercent >= 50 ? 'text-warning' :
    'text-text-tertiary'

  const barColor =
    scorePercent >= 80 ? 'bg-success' :
    scorePercent >= 50 ? 'bg-warning' :
    'bg-text-tertiary'

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left border border-border rounded-lg p-3 bg-surface-2 hover:bg-surface-3 transition-colors group animate-fade-in"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-5 h-5 rounded bg-accent-muted flex items-center justify-center text-accent text-[10px] font-bold">
            {citation.index}
          </span>
          <span className="text-text-primary text-xs font-medium truncate">
            {citation.filename}
          </span>
          <span className="text-text-tertiary text-[10px] shrink-0">
            chunk #{citation.chunk_index}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-1 w-12 bg-surface-4 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${scorePercent}%` }} />
          </div>
          <span className={`text-[10px] font-medium ${scoreColor} w-8 text-right`}>{scorePercent}%</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={`text-text-tertiary transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-border">
          <p className="text-text-secondary text-xs leading-relaxed">
            {citation.excerpt}
          </p>
        </div>
      )}
    </button>
  )
}
