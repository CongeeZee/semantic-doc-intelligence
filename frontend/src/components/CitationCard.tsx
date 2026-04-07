import type { Citation } from '../api/types'

interface Props {
  citation: Citation
}

export function CitationCard({ citation }: Props) {
  const scorePercent = Math.round(citation.score * 100)

  return (
    <div className="border border-slate-200 rounded-lg p-3 text-sm bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-violet-700">[{citation.index}]</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-400 rounded-full"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="text-slate-400 text-xs">{scorePercent}%</span>
        </div>
      </div>
      <p className="text-slate-600 leading-relaxed line-clamp-3">{citation.excerpt}</p>
      <p className="text-slate-300 text-xs mt-2 truncate">
        doc: {citation.document_id} · chunk #{citation.chunk_index}
      </p>
    </div>
  )
}
