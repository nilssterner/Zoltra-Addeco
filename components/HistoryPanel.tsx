'use client'
import { HistoryEntry } from '@/lib/types'

interface HistoryPanelProps {
  history: HistoryEntry[]
  onLoad: (entry: HistoryEntry) => void
  onClear: () => void
}

export default function HistoryPanel({ history, onLoad, onClear }: HistoryPanelProps) {
  if (history.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Senaste genereringar</h3>
        <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Rensa</button>
      </div>
      <ul className="space-y-2">
        {history.map(entry => (
          <li key={entry.id}>
            <button
              onClick={() => onLoad(entry)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-medium text-slate-700 truncate">{entry.formData.prospectName}</p>
              <p className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
