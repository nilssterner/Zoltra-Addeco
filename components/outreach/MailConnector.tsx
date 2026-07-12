'use client'
import { useState, useEffect } from 'react'

interface AccountInfo {
  id: string
  provider: 'gmail' | 'outlook'
  email: string
}

export default function MailConnector() {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetch('/api/connected-account')
      .then(r => r.json())
      .then(d => setAccount(d.account ?? null))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false))
  }, [])

  const disconnect = async () => {
    if (!confirm('Koppla bort mailkontot? Du kan koppla om det när som helst.')) return
    setDisconnecting(true)
    await fetch('/api/connected-account', { method: 'DELETE' }).catch(() => null)
    setAccount(null)
    setDisconnecting(false)
  }

  if (loading) return <div className="text-sm text-slate-400 py-4">Kontrollerar mailkoppling…</div>

  if (account) {
    return (
      <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {account.provider === 'gmail' ? 'G' : 'O'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {account.provider === 'gmail' ? 'Gmail' : 'Outlook'} kopplat
            </p>
            <p className="text-xs text-slate-500">{account.email}</p>
          </div>
        </div>
        <button
          onClick={disconnect}
          disabled={disconnecting}
          className="text-xs text-slate-500 hover:text-red-600 transition-colors"
        >
          {disconnecting ? 'Kopplar bort…' : 'Koppla bort'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Koppla ditt mailkonto</h3>
      <p className="text-xs text-slate-500 mb-4">
        Mailen skickas från din egna adress – vi har aldrig tillgång till din inkorg utan att du godkänner det.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/api/auth/gmail"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
          </svg>
          Koppla Gmail
        </a>
        <a
          href="/api/auth/outlook"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H7c-1.1 0-2 .9-2 2v2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 13H3V9h9v7zm9 2H7v-2h5c1.1 0 2-.9 2-2V7h7v11z"/>
          </svg>
          Koppla Outlook
        </a>
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Vi läser enbart av svarstrådar för att detektera svar. Vi skickar aldrig mail utan din godkänning.
      </p>
    </div>
  )
}
