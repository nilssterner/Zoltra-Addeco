'use client'
import { GenerateResponse } from '@/lib/types'
import CopyButton from './CopyButton'

interface ResultCardsProps {
  result: GenerateResponse
  onExport: () => void
  onNewVersion?: () => void
}

function Card({ title, children, copyText }: { title: string; children: React.ReactNode; copyText: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <CopyButton text={copyText} />
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

export default function ResultCards({ result, onExport, onNewVersion }: ResultCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Mailförslag</h2>
        <div className="flex items-center gap-2">
          {onNewVersion && (
            <button
              onClick={onNewVersion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Skapa ny version
            </button>
          )}
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportera .txt
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
        Läs alltid igenom och anpassa texten. Inget skickas utan att du godkänt det.
      </div>

      <Card title="Kundanalys" copyText={result.customerAnalysis}>
        <p className="text-sm text-slate-700 leading-relaxed">{result.customerAnalysis}</p>
      </Card>

      <Card title="Ämnesrader" copyText={result.subjectLines.join('\n')}>
        <ul className="space-y-2">
          {result.subjectLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
              <span className="text-sm text-slate-700">{line}</span>
            </li>
          ))}
        </ul>
      </Card>

      {result.emails.map((email, i) => (
        <Card key={i} title={`Mailförslag ${i + 1} – ${email.title}`} copyText={email.body}>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{email.body}</p>
        </Card>
      ))}

      <Card title="LinkedIn-meddelande" copyText={result.linkedinMessage}>
        <p className="text-sm text-slate-700 leading-relaxed">{result.linkedinMessage}</p>
      </Card>

      <Card title="Uppföljningsmail" copyText={result.followUpEmail}>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.followUpEmail}</p>
      </Card>
    </div>
  )
}
