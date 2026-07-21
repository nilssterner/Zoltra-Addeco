'use client'
import { useState } from 'react'
import { SequenceStep } from '@/lib/db/types'

interface SequenceBuilderProps {
  /** Förifyllda steg från AI-genererat mail (originalmail + uppföljning) */
  initialSteps?: SequenceStep[]
  initialName?: string
}

export default function SequenceBuilder({ initialSteps, initialName }: SequenceBuilderProps) {
  const [name, setName] = useState(initialName ?? '')
  const [steps, setSteps] = useState<SequenceStep[]>(
    initialSteps ?? [{ delay_days: 0, subject: '', body: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const addStep = () => {
    if (steps.length >= 4) return
    const prevDelay = steps[steps.length - 1]?.delay_days ?? 0
    setSteps([...steps, { delay_days: prevDelay + 3, subject: '', body: '' }])
  }

  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i))

  const updateStep = (i: number, field: keyof SequenceStep, value: string | number) =>
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))

  const save = async () => {
    if (!name.trim()) { setError('Ge sekvensen ett namn'); return }
    if (steps.some(s => !s.subject.trim() || !s.body.trim())) {
      setError('Fyll i ämne och innehåll för varje steg')
      return
    }
    setError('')
    setSaving(true)
    const res = await fetch('/api/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, steps }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Kunde inte spara sekvensen'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setName('')
    setSteps([{ delay_days: 0, subject: '', body: '' }])
  }

  const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition'

  return (
    <div className="space-y-5">
      {initialSteps && initialSteps.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
          Sekvensen är förifylld med ditt AI-genererade mail och uppföljningsmail. Justera fritt.
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Namn på sekvensen</label>
        <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="t.ex. Bygg-outreach maj" />
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-xs font-semibold text-slate-700">
                  {i === 0 ? 'Ursprungligt mail' : `Uppföljning ${i}`}
                </span>
              </div>
              {i > 0 && (
                <button onClick={() => removeStep(i)} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Ta bort
                </button>
              )}
            </div>

            {i > 0 && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Skickas (dagar efter föregående steg)
                </label>
                <input
                  type="number" min={1} max={60}
                  className={inputClass + ' w-24'}
                  value={step.delay_days}
                  onChange={e => updateStep(i, 'delay_days', Number(e.target.value))}
                />
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ämne</label>
                <input className={inputClass} value={step.subject} onChange={e => updateStep(i, 'subject', e.target.value)} placeholder="Ämnesrad" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Innehåll</label>
                <textarea
                  className={inputClass + ' resize-none'}
                  rows={5}
                  value={step.body}
                  onChange={e => updateStep(i, 'body', e.target.value)}
                  placeholder="Mailinnehåll…"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {steps.length < 4 && (
        <button
          onClick={addStep}
          className="w-full py-2 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Lägg till uppföljning
        </button>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="text-sm text-green-600 font-medium">✓ Sekvens sparad!</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
      >
        {saving ? 'Sparar…' : 'Spara sekvens'}
      </button>
    </div>
  )
}
