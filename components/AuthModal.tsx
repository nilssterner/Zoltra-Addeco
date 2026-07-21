'use client'
import { useState, useEffect } from 'react'

interface AuthModalProps {
  mode: 'login' | 'register'
  onClose: () => void
  onSwitchMode: (mode: 'login' | 'register') => void
}

export default function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) { setError('Ange en giltig e-postadress.'); return }
    if (password.length < 6) { setError('Lösenordet måste vara minst 6 tecken.'); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setDone(true)
  }

  const inputClass = "w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Logga in' : 'Skapa konto'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' ? 'Välkommen tillbaka till Zoltra' : 'Kom igång med Zoltra gratis'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-slate-900 mb-1">
                {mode === 'register' ? 'Tack för din registrering!' : 'Inloggning mottagen!'}
              </p>
              <p className="text-sm text-slate-500">
                {mode === 'register'
                  ? 'Kontohantering är under uppbyggnad. Vi meddelar dig på ' + email + ' när det är klart.'
                  : 'Inloggning är under uppbyggnad. Vi återkommer snart.'}
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Stäng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">E-postadress</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="din@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Lösenord</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder={mode === 'register' ? 'Minst 6 tecken' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {mode === 'login' ? 'Loggar in…' : 'Skapar konto…'}
                  </>
                ) : (
                  mode === 'login' ? 'Logga in' : 'Skapa konto'
                )}
              </button>

              <p className="text-center text-xs text-slate-500 pt-1">
                {mode === 'login' ? (
                  <>Inget konto?{' '}
                    <button type="button" onClick={() => onSwitchMode('register')} className="text-blue-600 font-medium hover:underline">
                      Registrera dig
                    </button>
                  </>
                ) : (
                  <>Har du redan ett konto?{' '}
                    <button type="button" onClick={() => onSwitchMode('login')} className="text-blue-600 font-medium hover:underline">
                      Logga in
                    </button>
                  </>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
