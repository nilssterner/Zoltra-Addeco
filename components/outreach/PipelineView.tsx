'use client'
import { useEffect, useState } from 'react'
import { LeadContact, LeadStatus, LEAD_STATUSES } from '@/lib/db/types'

export default function PipelineView() {
  const [leads, setLeads] = useState<LeadContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setLeads(d.leads ?? [])
      })
      .catch(() => setError('Kunde inte ladda pipeline'))
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    await fetch(`/api/leads/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => null)
  }

  if (loading) return <p className="text-sm text-slate-400 py-4">Laddar pipeline…</p>
  if (error) return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>

  if (!leads.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
        <p className="text-sm">Inga leads i pipeline ännu. Leads läggs till automatiskt när du skickar mail.</p>
      </div>
    )
  }

  const statusColor: Record<LeadStatus, string> = {
    ny: 'bg-slate-100 text-slate-600',
    kontaktad: 'bg-blue-100 text-blue-700',
    svarat: 'bg-amber-100 text-amber-700',
    möte_bokat: 'bg-green-100 text-green-700',
    avböjt: 'bg-red-100 text-red-700',
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Företag</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Uppdaterad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map(lead => (
            <tr key={lead.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{lead.name}</p>
                <p className="text-xs text-slate-400">{lead.email}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{lead.company || '—'}</td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  onChange={e => updateStatus(lead.id, e.target.value as LeadStatus)}
                  className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColor[lead.status]}`}
                >
                  {LEAD_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {new Date(lead.updated_at).toLocaleDateString('sv-SE')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
