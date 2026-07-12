'use client'
import { useState, useEffect } from 'react'
import LeadForm from '@/components/LeadForm'
import ResultCards from '@/components/ResultCards'
import HistoryPanel from '@/components/HistoryPanel'
import Hero from '@/components/Hero'
import Demo from '@/components/Demo'
import HowItWorks from '@/components/HowItWorks'
import Trust from '@/components/Trust'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import QuotaBar from '@/components/QuotaBar'
import OutreachTab from '@/components/outreach/OutreachTab'
import { FormData, GenerateResponse, HistoryEntry, LeadResult } from '@/lib/types'
import { EXAMPLE_DATA } from '@/lib/exampleData'
import { UserQuota, DEFAULT_QUOTA } from '@/lib/quota'

const UNBOUNDED_RADIUS_KM = 9999
const RADIUS_OPTIONS: { km: number; label: string }[] = [
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 25, label: '25 km' },
  { km: 50, label: '50 km' },
  { km: 75, label: '75 km' },
  { km: 100, label: '100 km' },
  { km: UNBOUNDED_RADIUS_KM, label: '100+ km' },
]

const EMPTY_FORM: FormData = {
  companyName: '', companyDescription: '', productService: '', targetAudience: '', companyCity: '',
  searchCity: '', leadIndustry: '', leadCriteria: '', searchRadiusKm: 25,
  prospectName: '', prospectEmail: '', prospectWebsite: '', prospectIndustry: '', prospectProblem: '',
  tone: 'Professionell', length: 'Kort', language: 'Svenska', cta: 'Boka möte',
}

const inputClass = "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function LeadCard({ lead, onSelect }: { lead: LeadResult; onSelect: (lead: LeadResult) => void }) {
  return (
    <div className={`rounded-xl border p-4 transition ${lead.isBestMatch ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          {lead.isBestMatch && (
            <span className="inline-block mb-1.5 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              ★ Bästa matchningen
            </span>
          )}
          <p className="text-sm font-semibold text-slate-900 truncate">{lead.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{lead.address}</p>
        </div>
        {lead.rating ? (
          <span className="text-xs font-semibold text-amber-600 whitespace-nowrap flex-shrink-0">⭐ {lead.rating}</span>
        ) : null}
      </div>
      {lead.matchReason && (
        <p className="text-xs text-blue-700 mb-3 leading-relaxed">{lead.matchReason}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        {lead.distanceKm != null && <span>{lead.distanceKm.toFixed(1)} km bort</span>}
        {lead.phone && <span>{lead.phone}</span>}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline truncate max-w-[180px]">{lead.email}</a>
        )}
        {lead.website && (
          <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            Öppna hemsida ↗
          </a>
        )}
        {lead.googleMapsUrl && (
          <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            Google Maps ↗
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSelect(lead)}
        className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
      >
        Skapa mail till detta företag
      </button>
    </div>
  )
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [leadResults, setLeadResults] = useState<LeadResult[]>([])
  const [leadSummary, setLeadSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState<'company' | 'leads' | 'email' | 'outreach'>('company')
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null)
  const [quota, setQuota] = useState<UserQuota>({ ...DEFAULT_QUOTA })

  const isCompanyComplete = Boolean(
    formData.companyName.trim() &&
    formData.companyDescription.trim() &&
    formData.productService.trim() &&
    formData.targetAudience.trim()
  )
  const isLeadChosen = Boolean(formData.prospectName.trim())
  const canAccessLeads = isCompanyComplete || activeTab === 'leads'
  const canAccessEmail = isCompanyComplete && (isLeadChosen || activeTab === 'email')
  const canAccessOutreach = canAccessEmail || activeTab === 'outreach'

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ll_history')
      if (stored) setHistory(JSON.parse(stored))
    } catch { /* ignore */ }
    // Hämta aktuell kvot från servern (applicerar ev. månadsåterställning)
    fetch('/api/quota')
      .then(r => r.json())
      .then(d => { if (d.quota) setQuota(d.quota) })
      .catch(() => { /* quota visas med default-värde */ })
  }, [])

  const saveToHistory = (form: FormData, res: GenerateResponse) => {
    const entry: HistoryEntry = { id: Date.now().toString(), timestamp: Date.now(), formData: form, result: res }
    const updated = [entry, ...history].slice(0, 5)
    setHistory(updated)
    try { localStorage.setItem('ll_history', JSON.stringify(updated)) } catch { /* ignore */ }
  }

  const handleFindLeads = async () => {
    setError(null)
    setLeadResults([])
    setLeadSummary(null)
    setResult(null)

    if (!formData.leadIndustry.trim()) { setError('Ange en bransch att söka efter.'); return }
    if (!formData.searchCity.trim()) { setError('Ange en stad att söka i.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/find-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIndustry: formData.leadIndustry,
          leadCriteria: formData.leadCriteria,
          searchRadiusKm: formData.searchRadiusKm,
          searchCity: formData.searchCity,
          companyName: formData.companyName,
          companyDescription: formData.companyDescription,
          productService: formData.productService,
          targetAudience: formData.targetAudience,
        }),
      })
      const data = await res.json()
      if (data.quota) setQuota(data.quota)
      if (!res.ok) { setError(data.error || 'Vi kunde inte hitta leads just nu. Prova att bredda sökningen eller välja en annan stad.'); return }

      const hasLeads = Array.isArray(data.leads) && data.leads.length > 0
      setLeadResults(hasLeads ? data.leads : [])
      setLeadSummary(data.message || null)
      if (!hasLeads) { setError('Inga leads hittades i det här området. Prova ett större avstånd eller en annan bransch.'); return }
    } catch {
      setError('Kunde inte ansluta till servern. Kontrollera din internetanslutning och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLead = (lead: LeadResult) => {
    setFormData({
      ...formData,
      prospectName: lead.name,
      prospectEmail: lead.email ?? '',
      prospectWebsite: lead.website,
      prospectIndustry: formData.leadIndustry,
      prospectProblem: lead.matchReason || formData.prospectProblem,
    })
    setActiveTab('email')
  }

  const handleGenerate = async () => {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const selectedLead = leadResults.find(l => l.name === formData.prospectName)
      const contextLeads = selectedLead ? [selectedLead] : leadResults
      const leadContext = contextLeads
        .map(lead => {
          const details = [lead.name, lead.address, lead.phone, lead.website, lead.email].filter(Boolean).join(' | ')
          const rating = lead.rating ? `⭐ ${lead.rating}` : ''
          const reviews = lead.reviewCount ? `(${lead.reviewCount} omdömen)` : ''
          const reason = lead.matchReason ? ` — ${lead.matchReason}` : ''
          return `- ${details}${rating ? ` ${rating}` : ''}${reviews ? ` ${reviews}` : ''}${reason}`
        })
        .join('\n')

      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, leadContext }),
      })
      const data = await res.json()
      if (data.quota) setQuota(data.quota)
      if (!res.ok) { setError(data.error || 'Något gick fel vid genereringen. Försök igen.'); return }
      const { quota: _q, ...resultData } = data
      setResult(resultData)
      saveToHistory(formData, data)
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setError('Kunde inte ansluta till servern. Kontrollera din internetanslutning och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!result) return
    const lines = [
      `Zoltra – Export`,
      `Mottagare: ${formData.prospectName}`,
      `Datum: ${new Date().toLocaleString('sv-SE')}`,
      `\n--- KUNDANALYS ---\n${result.customerAnalysis}`,
      `\n--- ÄMNESRADER ---\n${result.subjectLines.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      ...result.emails.map(e => `\n--- ${e.title.toUpperCase()} ---\n${e.body}`),
      `\n--- LINKEDIN ---\n${result.linkedinMessage}`,
      `\n--- UPPFÖLJNING ---\n${result.followUpEmail}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoltra-${formData.prospectName || 'export'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleNewVersion = () => {
    setResult(null)
    setTimeout(() => document.getElementById('email-form')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const clearAll = () => {
    setFormData(EMPTY_FORM)
    setResult(null)
    setError(null)
    setLeadResults([])
    setLeadSummary(null)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="font-bold text-slate-900 text-base tracking-tight">Zoltra</a>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <a href="#demo" className="text-slate-500 hover:text-slate-900 transition-colors">Exempel</a>
            <a href="#how" className="text-slate-500 hover:text-slate-900 transition-colors">Hur det fungerar</a>
            <a href="#pris" className="text-slate-500 hover:text-slate-900 transition-colors">Pris</a>
            <div className="w-px h-4 bg-slate-200" />
            <button
              type="button"
              onClick={() => setAuthModal('login')}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Logga in
            </button>
            <button
              type="button"
              onClick={() => setAuthModal('register')}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
            >
              Registrera dig
            </button>
          </nav>
          <div className="sm:hidden flex items-center gap-2">
            <button type="button" onClick={() => setAuthModal('login')} className="text-xs text-slate-600 font-medium">Logga in</button>
            <button type="button" onClick={() => setAuthModal('register')} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors">Registrera</button>
          </div>
        </div>
      </header>

      {/* Landing sections */}
      <Hero />
      <div id="demo"><Demo /></div>
      <div id="how"><HowItWorks /></div>
      <Trust />
      <div id="pris"><Pricing /></div>

      {/* App section */}
      <section id="app" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Kom igång</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
              Beskriv ditt företag så hjälper Zoltra dig att hitta relevanta leads och skapa personliga mailförslag.
            </p>
          </div>

          {/* Tab nav */}
          <div className="mb-6 flex rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === 'company' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              1. Ditt företag
            </button>
            <button
              type="button"
              onClick={() => canAccessLeads && setActiveTab('leads')}
              disabled={!canAccessLeads}
              title={!canAccessLeads ? 'Fyll i om ditt företag först' : undefined}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === 'leads' ? 'bg-blue-600 text-white shadow-sm' : canAccessLeads ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
            >
              2. Hitta leads
            </button>
            <button
              type="button"
              onClick={() => canAccessEmail && setActiveTab('email')}
              disabled={!canAccessEmail}
              title={!canAccessEmail ? 'Hitta och välj ett lead först' : undefined}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === 'email' ? 'bg-blue-600 text-white shadow-sm' : canAccessEmail ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
            >
              3. Skapa mail
            </button>
            <button
              type="button"
              onClick={() => canAccessOutreach && setActiveTab('outreach')}
              disabled={!canAccessOutreach}
              title={!canAccessOutreach ? 'Generera ett mail först' : undefined}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === 'outreach' ? 'bg-blue-600 text-white shadow-sm' : canAccessOutreach ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
            >
              4. Utskick
            </button>
          </div>

          {/* Kvotvisning – alltid synlig i app-sektionen */}
          <div className="mb-4">
            <QuotaBar quota={quota} />
          </div>

          {/* Tab: Ditt företag */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Om ditt företag</h3>
                <p className="text-sm text-slate-500 mb-5">Informationen används för att hitta rätt leads och skapa personliga mail.</p>
                <div className="space-y-4">
                  <Field label="Ditt företagsnamn">
                    <input className={inputClass} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} placeholder="t.ex. Johanssons Redovisning AB" />
                  </Field>
                  <Field label="Vad säljer du?" hint="Beskriv kort vad ni gör och vilka ni hjälper">
                    <textarea
                      className={inputClass + ' resize-none'}
                      rows={3}
                      value={formData.companyDescription}
                      onChange={e => setFormData({ ...formData, companyDescription: e.target.value })}
                      placeholder="t.ex. Vi är en redovisningsbyrå som hjälper mindre företag med bokföring, löner och bokslut."
                    />
                  </Field>
                  <Field label="Produkt eller tjänst">
                    <input className={inputClass} value={formData.productService} onChange={e => setFormData({ ...formData, productService: e.target.value })} placeholder="t.ex. redovisningstjänster, IT-support, kontorsstädning, elinstallationer…" />
                  </Field>
                  <Field label="Vem vill du nå?">
                    <input className={inputClass} value={formData.targetAudience} onChange={e => setFormData({ ...formData, targetAudience: e.target.value })} placeholder="t.ex. restauranger, fastighetsbolag, webbyråer, kontor…" />
                  </Field>
                  <Field label="Stad" hint="Staden ditt företag utgår ifrån">
                    <input className={inputClass} value={formData.companyCity} onChange={e => setFormData({ ...formData, companyCity: e.target.value })} placeholder="t.ex. Göteborg" />
                  </Field>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => isCompanyComplete && setActiveTab('leads')}
                    disabled={!isCompanyComplete}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hitta leads →
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(EXAMPLE_DATA)}
                    className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Ladda demoexempel
                  </button>
                </div>
                {!isCompanyComplete && (
                  <p className="mt-3 text-xs text-slate-400">Fyll i namn, beskrivning, produkt/tjänst och målgrupp för att gå vidare.</p>
                )}
              </div>
              <HistoryPanel
                history={history}
                onLoad={e => { setFormData(e.formData); setResult(e.result) }}
                onClear={() => { setHistory([]); localStorage.removeItem('ll_history') }}
              />
            </div>
          )}

          {/* Tab: Hitta leads */}
          {activeTab === 'leads' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Hitta lokala företag</h3>
                  <p className="text-sm text-slate-500 mb-5">Sök på stad, bransch och avstånd. Vi rangordnar träffarna med AI.</p>
                  <div className="space-y-4">
                    <Field label="Stad *" hint="Den stad Google Places söker från">
                      <input className={inputClass} value={formData.searchCity} onChange={e => setFormData({ ...formData, searchCity: e.target.value })} placeholder="t.ex. Göteborg" />
                    </Field>
                    <Field label="Bransch">
                      <input className={inputClass} value={formData.leadIndustry} onChange={e => setFormData({ ...formData, leadIndustry: e.target.value })} placeholder="t.ex. restaurang, bygg, webbyrå, redovisning…" />
                    </Field>
                    <Field label="Beskriv mer specifikt vad du söker" hint="Ju mer specifikt, desto bättre matchning">
                      <textarea
                        className={inputClass + ' resize-none'}
                        rows={4}
                        value={formData.leadCriteria}
                        onChange={e => setFormData({ ...formData, leadCriteria: e.target.value })}
                        placeholder="t.ex. restauranger med take away som troligtvis använder mycket engångsförpackningar…"
                      />
                    </Field>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Avstånd från staden</label>
                      <div className="flex flex-wrap gap-1.5">
                        {RADIUS_OPTIONS.map(({ km, label }) => (
                          <button
                            key={km}
                            type="button"
                            onClick={() => setFormData({ ...formData, searchRadiusKm: km })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${formData.searchRadiusKm === km ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFindLeads}
                    disabled={loading}
                    className="mt-6 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
                  >
                    {loading ? 'Söker leads…' : 'Hitta leads'}
                  </button>
                  {error && (
                    <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
                <HistoryPanel
                  history={history}
                  onLoad={e => { setFormData(e.formData); setResult(e.result) }}
                  onClear={() => { setHistory([]); localStorage.removeItem('ll_history') }}
                />
              </div>

              <div id="lead-results" className="space-y-3">
                {loading && (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-4 text-slate-500">
                    <Spinner />
                    <p className="text-sm text-center">Söker och rangordnar lokala företag…</p>
                  </div>
                )}
                {!loading && leadResults.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">Hittade leads</h3>
                      <p className="text-xs text-slate-400">Rangordnade efter bäst passform</p>
                    </div>
                    {leadResults.map((lead, i) => (
                      <LeadCard key={lead.id || i} lead={lead} onSelect={handleSelectLead} />
                    ))}
                  </>
                )}
                {!loading && leadSummary && !error && (
                  <p className="text-xs text-slate-500 text-center py-2">{leadSummary}</p>
                )}
                {!loading && !leadResults.length && !error && !leadSummary && (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 text-slate-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103 10.5a7.5 7.5 0 0013.15 6.15z" />
                    </svg>
                    <p className="text-sm text-center">Fyll i stad och bransch, klicka sedan på Hitta leads.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Skapa mail */}
          {activeTab === 'email' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4" id="email-form">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <LeadForm
                    formData={formData}
                    onChange={setFormData}
                    onSubmit={handleGenerate}
                    onClear={clearAll}
                    onLoadExample={() => setFormData(EXAMPLE_DATA)}
                    loading={loading}
                    error={error}
                    submitLabel="Generera mailförslag"
                  />
                </div>
                <HistoryPanel
                  history={history}
                  onLoad={e => { setFormData(e.formData); setResult(e.result) }}
                  onClear={() => { setHistory([]); localStorage.removeItem('ll_history') }}
                />
              </div>

              <div id="results">
                {loading && (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-4 text-slate-500">
                    <Spinner />
                    <p className="text-sm">Genererar personliga säljmail…</p>
                  </div>
                )}
                {!loading && result && (
                  <ResultCards result={result} onExport={handleExport} onNewVersion={handleNewVersion} />
                )}
                {!loading && !result && !error && (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 text-slate-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <p className="text-sm text-center">Fyll i mottagaren och klicka på<br /><span className="font-medium text-slate-600">Generera mailförslag</span>.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Utskick */}
          {activeTab === 'outreach' && (
            <OutreachTab
              quota={quota}
              result={result}
              prospectName={formData.prospectName}
              prospectEmail={formData.prospectEmail}
            />
          )}
        </div>
      </section>

      <Footer />

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitchMode={mode => setAuthModal(mode)}
        />
      )}
    </div>
  )
}
