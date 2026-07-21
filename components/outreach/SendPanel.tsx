'use client'
import { useState } from 'react'
import { GenerateResponse } from '@/lib/types'

interface SendPanelProps {
  result: GenerateResponse | null
  prospectName: string
  prospectEmail: string
}

export default function SendPanel({ result, prospectName, prospectEmail }: SendPanelProps) {
  const [to, setTo] = useState(prospectEmail)
  const [subject, setSubject] = useState(result?.subjectLines?.[0] ?? '')
  const [body, setBody] = useState(result?.emails?.[0]?.body ?? '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    if (!to || !subject || !body) { setError('Fyll i alla fält'); return }
    setError('')
    setSending(true)
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, leadName: prospectName, subject, body }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setError(data.error ?? 'Utskick misslyckades'); return }
    setSent(true)
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition'

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-slate-900 mb-1">Mail skickat!</p>
        <p className="text-sm text-slate-500">Mailet är skickat till {to} från ditt kopplade mailkonto.</p>
        <button onClick={() => setSent(false)} className="mt-4 text-sm text-blue-600 hover:underline">Skicka ett till</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
        Mailet skickas från ditt kopplade mailkonto. Du kan justera ämne och innehåll nedan.
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Till</label>
        <input className={inputClass} value={to} onChange={e => setTo(e.target.value)} placeholder="lead@foretag.se" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Ämne</label>
        <input className={inputClass} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ämnesrad" />
      </div>

      {result && result.subjectLines.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {result.subjectLines.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSubject(s)}
              className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Innehåll</label>
        <textarea
          className={inputClass + ' resize-none'}
          rows={8}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Mailinnehåll…"
        />
      </div>

      {result && result.emails.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-400">Förslag:</span>
          {result.emails.map((e, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBody(e.body)}
              className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-colors"
            >
              {e.title}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={send}
        disabled={sending}
        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Skickar…
          </>
        ) : 'Skicka mail'}
      </button>
    </div>
  )
}
