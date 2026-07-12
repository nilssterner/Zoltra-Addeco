'use client'
import { useEffect, useState } from 'react'
import { OutboxEntry, OutboxStatus } from '@/lib/db/types'

const STATUS_LABEL: Record<OutboxStatus, { label: string; cls: string }> = {
  sent: { label: 'Skickat', cls: 'bg-blue-100 text-blue-700' },
  failed: { label: 'Misslyckades', cls: 'bg-red-100 text-red-700' },
  replied: { label: 'Svarat', cls: 'bg-green-100 text-green-700' },
}

export default function OutboxView() {
  const [entries, setEntries] = useState<OutboxEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/outbox')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-400 py-4">Laddar utskickslogg…</p>

  if (!entries.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
        <p className="text-sm">Inga utskick ännu. Skicka ditt första mail under "Skicka".</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mottagare</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ämne</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Skickat</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map(e => {
            const s = STATUS_LABEL[e.status] ?? STATUS_LABEL.sent
            return (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 truncate max-w-[160px]">{e.lead_name || e.lead_email}</p>
                  <p className="text-xs text-slate-400 truncate max-w-[160px]">{e.lead_email}</p>
                </td>
                <td className="px-4 py-3 text-slate-700 truncate max-w-[200px]">{e.subject}</td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                  {e.sent_at ? new Date(e.sent_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
