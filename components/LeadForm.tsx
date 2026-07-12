'use client'
import { FormData, Tone, Length, Language, CTA } from '@/lib/types'

interface LeadFormProps {
  formData: FormData
  onChange: (data: FormData) => void
  onSubmit: () => void
  onClear: () => void
  onLoadExample: () => void
  loading: boolean
  error: string | null
  submitLabel?: string
}

const TONES: Tone[] = ['Professionell', 'Vänlig', 'Direkt', 'Premium', 'Lokal']
const LENGTHS: Length[] = ['Kort', 'Medium']
const LANGUAGES: Language[] = ['Svenska', 'Engelska']
const CTAS: CTA[] = ['Boka möte', 'Svara på mailet', 'Besöka hemsida', 'Telefonsamtal']

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

const inputClass = "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
const textareaClass = inputClass + " resize-none"

export default function LeadForm({ formData, onChange, onSubmit, onClear, onLoadExample, loading, error, submitLabel = 'Generera mailförslag' }: LeadFormProps) {
  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...formData, [key]: e.target.value })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={onLoadExample} type="button" className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
          Ladda demoexempel
        </button>
        <button onClick={onClear} type="button" className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
          Rensa
        </button>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-800">Din företagsinformation används automatiskt som kontext.</p>
        <p className="text-xs text-blue-700 mt-0.5">Fyll i vem mailet ska gå till och välj tonläge.</p>
      </div>

      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mottagare</h3>
        <div className="space-y-3">
          <Field label="Företagets namn *" hint="Fylls i automatiskt när du väljer ett lead">
            <input
              className={inputClass}
              value={formData.prospectName}
              onChange={set('prospectName')}
              placeholder="t.ex. Johanssons Bygg AB"
            />
          </Field>
          <Field label="E-postadress" hint="Används för utskick via Utskick-fliken">
            <input className={inputClass} type="email" value={formData.prospectEmail} onChange={set('prospectEmail')} placeholder="kontakt@foretag.se" />
          </Field>
          <Field label="Hemsida">
            <input className={inputClass} value={formData.prospectWebsite} onChange={set('prospectWebsite')} placeholder="https://..." />
          </Field>
          <Field label="Bransch eller typ av verksamhet">
            <input className={inputClass} value={formData.prospectIndustry} onChange={set('prospectIndustry')} placeholder="t.ex. byggföretag, webbyrå, restaurang…" />
          </Field>
          <Field label="Varför kontaktar du dem? (valfritt)" hint="Ju mer specifikt, desto mer relevant mail">
            <textarea
              className={textareaClass}
              rows={3}
              value={formData.prospectProblem}
              onChange={set('prospectProblem')}
              placeholder="t.ex. De verkar växa snabbt och kan behöva hjälp med administration…"
            />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mailinställningar</h3>
        <div className="space-y-3">
          <Field label="Ton">
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} type="button" onClick={() => onChange({ ...formData, tone: t })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${formData.tone === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Längd">
              <div className="flex gap-2">
                {LENGTHS.map(l => (
                  <button key={l} type="button" onClick={() => onChange({ ...formData, length: l })}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${formData.length === l ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Språk">
              <div className="flex gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => onChange({ ...formData, language: l })}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${formData.language === l ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Vad vill du att de ska göra?">
            <select className={inputClass} value={formData.cta} onChange={set('cta')}>
              {CTAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Genererar mailförslag...
          </>
        ) : submitLabel}
      </button>

      <p className="text-center text-xs text-slate-400">
        Läs alltid igenom och anpassa mailet innan du skickar det.
      </p>
    </div>
  )
}
