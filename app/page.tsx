'use client'
import { useState, useEffect } from 'react'
import LeadForm from '@/components/LeadForm'
import ResultCards from '@/components/ResultCards'
import HistoryPanel from '@/components/HistoryPanel'
import { FormData, GenerateResponse, HistoryEntry, LeadResult } from '@/lib/types'
import { EXAMPLE_DATA } from '@/lib/exampleData'

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
  prospectName: '', prospectWebsite: '', prospectIndustry: '', prospectProblem: '',
  tone: 'Professionell', length: 'Kort', language: 'Svenska', cta: 'Boka möte',
}

function LeadCard({ lead, onSelect }: { lead: LeadResult; onSelect: (lead: LeadResult) => void }) {
  return (
    <div className={`rounded-xl border p-4 ${lead.isBestMatch ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          {lead.isBestMatch && (
            <span className="inline-block mb-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">★ Bästa matchningen</span>
          )}
          <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
          <p className="text-sm text-slate-600">{lead.address}</p>
        </div>
        {lead.rating ? (
          <span className="text-sm font-semibold text-amber-600 whitespace-nowrap">⭐ {lead.rating}</span>
        ) : null}
      </div>
      {lead.matchReason && (
        <p className="mt-2 text-xs text-blue-700">{lead.matchReason}</p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {lead.distanceKm != null ? <p className="text-sm text-slate-600">{lead.distanceKm.toFixed(1)} km bort</p> : null}
        {lead.phone ? <p className="text-sm text-slate-600">Telefon: {lead.phone}</p> : null}
        {lead.website ? (
          <a className="text-sm text-blue-600 hover:underline" href={lead.website} target="_blank" rel="noreferrer">Hemsida</a>
        ) : null}
        {lead.email ? (
          <a className="text-sm text-blue-600 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>
        ) : null}
        {lead.googleMapsUrl ? (
          <a className="text-sm text-blue-600 hover:underline" href={lead.googleMapsUrl} target="_blank" rel="noreferrer">Google Maps</a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onSelect(lead)}
        className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
      >
        Skriv mail till detta företag
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
  const [activeTab, setActiveTab] = useState<'company' | 'leads' | 'email'>('company')

  const isCompanyComplete = Boolean(
    formData.companyName.trim() &&
    formData.companyDescription.trim() &&
    formData.productService.trim() &&
    formData.targetAudience.trim()
  )
  const isLeadChosen = Boolean(formData.prospectName.trim())
  const canAccessLeads = isCompanyComplete || activeTab === 'leads'
  const canAccessEmail = isCompanyComplete && (isLeadChosen || activeTab === 'email')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ll_history')
      if (stored) setHistory(JSON.parse(stored))
    } catch { /* ignore */ }
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

    if (!formData.leadIndustry.trim()) {
      setError('Ange en bransch att söka efter.')
      return
    }
    if (!formData.searchCity.trim()) {
      setError('Ange en stad att söka i.')
      return
    }

    setLoading(true)
    try {
      const leadRes = await fetch('/api/find-leads', {
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

      const leadData = await leadRes.json()
      if (!leadRes.ok) {
        setError(leadData.message || leadData.error || 'Kunde inte hämta leaddata.')
        return
      }

      const hasLeads = Array.isArray(leadData.leads) && leadData.leads.length > 0
      setLeadResults(hasLeads ? leadData.leads : [])
      setLeadSummary(leadData.message || null)

      if (!hasLeads) {
        setError(leadData.message || 'Inga riktiga leads hittades.')
        return
      }

      setTimeout(() => document.getElementById('lead-results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setError('Kunde inte ansluta. Kontrollera att servern körs.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLead = (lead: LeadResult) => {
    setFormData({
      ...formData,
      prospectName: lead.name,
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
      const selectedLead = leadResults.find(lead => lead.name === formData.prospectName)
      const contextLeads = selectedLead ? [selectedLead] : leadResults

      const leadContext = contextLeads
        .map(lead => {
          const details = [lead.name, lead.address, lead.phone, lead.website, lead.email]
            .filter(Boolean)
            .join(' | ')
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
      if (!res.ok) { setError(data.error || 'Något gick fel.'); return }
      setResult(data)
      saveToHistory(formData, data)
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {
      setError('Kunde inte ansluta. Kontrollera att servern körs.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!result) return
    const lines = [
      `Zoltra-Addeco – Export`,
      `Kund: ${formData.prospectName}`,
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
    a.href = url; a.download = `zoltra-addeco-${formData.prospectName || 'export'}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Zoltra-Addeco</span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Create personal B2B outreach emails in seconds.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'company' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Om företaget
          </button>
          <button
            type="button"
            onClick={() => canAccessLeads && setActiveTab('leads')}
            disabled={!canAccessLeads}
            title={!canAccessLeads ? 'Fyll i Om företaget först' : undefined}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'leads' ? 'bg-blue-600 text-white' : canAccessLeads ? 'bg-white text-slate-600 hover:bg-slate-50' : 'bg-white text-slate-300 cursor-not-allowed'}`}
          >
            Hitta leads
          </button>
          <button
            type="button"
            onClick={() => canAccessEmail && setActiveTab('email')}
            disabled={!canAccessEmail}
            title={!canAccessEmail ? 'Hitta och välj ett lead först' : undefined}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'email' ? 'bg-blue-600 text-white' : canAccessEmail ? 'bg-white text-slate-600 hover:bg-slate-50' : 'bg-white text-slate-300 cursor-not-allowed'}`}
          >
            Skapa mail
          </button>
        </div>

        {activeTab === 'company' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Om ditt företag</h2>
                    <p className="text-sm text-slate-500">Fyll i allt som behövs för att hitta bästa möjliga lead och skriva ett bra mail.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Företagsnamn</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Aristo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Vad gör ni?</label>
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      value={formData.companyDescription}
                      onChange={e => setFormData({ ...formData, companyDescription: e.target.value })}
                      placeholder="Kort beskrivning av verksamheten..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Produkt/tjänst</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.productService}
                      onChange={e => setFormData({ ...formData, productService: e.target.value })}
                      placeholder="Måttanpassade skjutdörrar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Målgrupp</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.targetAudience}
                      onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                      placeholder="Byggföretag och fastighetsbolag"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stad</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.companyCity}
                      onChange={e => setFormData({ ...formData, companyCity: e.target.value })}
                      placeholder="t.ex. Stockholm"
                    />
                    <p className="mt-1 text-xs text-slate-400">Staden ditt företag utgår ifrån.</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => isCompanyComplete && setActiveTab('leads')}
                    disabled={!isCompanyComplete}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Gå till leads
                  </button>
                </div>
                {!isCompanyComplete && (
                  <p className="mt-2 text-xs text-amber-600">Fyll i namn, beskrivning, produkt/tjänst och målgrupp för att gå vidare.</p>
                )}
              </div>
              <HistoryPanel
                history={history}
                onLoad={e => { setFormData(e.formData); setResult(e.result) }}
                onClear={() => { setHistory([]); localStorage.removeItem('ll_history') }}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Så här fungerar flödet</h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>• Fyll i info om ditt företag för bästa sökresultat.</li>
                  <li>• Under Hitta leads söker du på stad, bransch och avstånd – vi hittar och rangordnar lokala företag via Google Places.</li>
                  <li>• Välj det bästa leadet direkt från listan, så fylls mottagaren i automatiskt under Skapa mail.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : activeTab === 'leads' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Hitta lokala företag</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stad *</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.searchCity}
                      onChange={e => setFormData({ ...formData, searchCity: e.target.value })}
                      placeholder="t.ex. Stockholm"
                    />
                    <p className="mt-1 text-xs text-slate-400">Utgångspunkten Google Places söker ifrån.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bransch</label>
                    <input
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.leadIndustry}
                      onChange={e => setFormData({ ...formData, leadIndustry: e.target.value })}
                      placeholder="Bygg och renovering"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Beskriv vilka kunder du söker mer specifikt</label>
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={5}
                      value={formData.leadCriteria}
                      onChange={e => setFormData({ ...formData, leadCriteria: e.target.value })}
                      placeholder="t.ex. inte bara matkedjor i allmänhet, utan specifikt restauranger som använder mycket pappkartonger/take away-förpackningar"
                    />
                    <p className="mt-1 text-xs text-slate-400">Ju mer specifik beskrivning, desto bättre kan vi rangordna träffarna efter hur väl de passar.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Avstånd från staden</label>
                    <div className="flex flex-wrap gap-2">
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
                  className="mt-5 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? 'Söker leads...' : 'Hitta leads'}
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

            <div id="lead-results">
              {loading && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-4 text-slate-500">
                  <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-sm">Söker och rangordnar lokala företag via Google Places...</p>
                </div>
              )}
              {!loading && leadResults.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Hittade leads</h2>
                      <p className="text-sm text-slate-500">Rangordnade efter bäst passform mot ditt företag.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {leadResults.map((lead, index) => (
                      <LeadCard key={lead.id || index} lead={lead} onSelect={handleSelectLead} />
                    ))}
                  </div>
                </div>
              )}
              {!loading && leadSummary && !error && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
                  <p className="text-sm text-slate-600">{leadSummary}</p>
                </div>
              )}
              {!loading && !leadResults.length && !error && !leadSummary && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 text-slate-400">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103 10.5a7.5 7.5 0 0013.15 6.15z" />
                  </svg>
                  <p className="text-sm text-center">Sök efter lokala företag för att se Google Maps-resultat här.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <LeadForm
                  formData={formData}
                  onChange={setFormData}
                  onSubmit={handleGenerate}
                  onClear={() => { setFormData(EMPTY_FORM); setResult(null); setError(null); setLeadResults([]); setLeadSummary(null) }}
                  onLoadExample={() => setFormData(EXAMPLE_DATA)}
                  loading={loading}
                  error={error}
                  submitLabel="Generera professionellt mail"
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
                  <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-sm">Genererar personliga säljmail...</p>
                </div>
              )}
              {!loading && result && <ResultCards result={result} onExport={handleExport} />}
              {!loading && !result && !error && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3 text-slate-400">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <p className="text-sm text-center">Fyll i formuläret och klicka på<br /><span className="font-medium text-slate-600">Generera säljmail</span> för att komma igång.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
