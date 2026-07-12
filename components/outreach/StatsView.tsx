'use client'
import { useEffect, useState } from 'react'

interface Stats {
  totalSent: number
  totalReplied: number
  replyRate: number
  totalMeetings: number
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error) } else { setStats(d) } })
      .catch(() => setError('Kunde inte ladda statistik'))
  }, [])

  if (error) return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
  if (!stats) return <p className="text-sm text-slate-400 py-4">Laddar statistik…</p>

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard label="Skickade" value={String(stats.totalSent)} />
      <StatCard label="Svar" value={String(stats.totalReplied)} />
      <StatCard label="Svarsfrekvens" value={`${stats.replyRate} %`} sub="av skickade" />
      <StatCard label="Möten bokade" value={String(stats.totalMeetings)} />
    </div>
  )
}
