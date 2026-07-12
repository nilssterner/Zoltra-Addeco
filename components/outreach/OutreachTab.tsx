'use client'
import { useState } from 'react'
import { UserQuota } from '@/lib/quota'
import { PLANS } from '@/lib/plans'
import { GenerateResponse } from '@/lib/types'
import MailConnector from './MailConnector'
import SendPanel from './SendPanel'
import SequenceBuilder from './SequenceBuilder'
import OutboxView from './OutboxView'
import PipelineView from './PipelineView'
import StatsView from './StatsView'

interface OutreachTabProps {
  quota: UserQuota
  result: GenerateResponse | null
  prospectName: string
  prospectEmail: string
}

type SubTab = 'skicka' | 'sekvenser' | 'logg' | 'pipeline' | 'statistik'

function LockedFeature({ planNeeded, feature }: { planNeeded: string; feature: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-900">{feature} kräver {planNeeded}</p>
        <a href="#pris" className="text-xs text-blue-600 font-medium hover:underline">Uppgradera din plan →</a>
      </div>
      <div className="opacity-30 pointer-events-none rounded-xl border border-slate-200 p-6 bg-slate-50 h-40" />
    </div>
  )
}

export default function OutreachTab({ quota, result, prospectName, prospectEmail }: OutreachTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('skicka')
  const plan = PLANS[quota.planId]

  // Free / Start – visa locked state för hela utskicksflödet
  if (!plan.canSendEmail) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Utskick kräver Pro eller Pro Max</p>
              <p className="text-xs text-amber-700 mt-1">
                På {plan.name}-planen kan du generera mailförslag och kopiera dem manuellt.
                Uppgradera till Pro för att skicka direkt från din Gmail eller Outlook.
              </p>
              <a href="#pris" className="inline-block mt-3 text-xs font-semibold text-amber-800 underline hover:text-amber-900">
                Se alla planer →
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-40 pointer-events-none">
          {[
            { icon: '📤', title: 'Direktutskick', desc: 'Skicka mail direkt via Gmail eller Outlook' },
            { icon: '🔄', title: 'Uppföljningssekvenser', desc: 'Automatiska uppföljningar med stopp vid svar' },
            { icon: '📊', title: 'Utskickslogg', desc: 'Spåra status och svar per utskick' },
            { icon: '🚀', title: 'Pipeline (Pro Max)', desc: 'Hantera och spåra leads från ny till möte' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-xl">{f.icon}</span>
              <p className="font-semibold text-slate-900 mt-2 text-sm">{f.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'skicka', label: 'Skicka' },
    { id: 'sekvenser', label: 'Sekvenser' },
    { id: 'logg', label: 'Utskickslogg' },
    ...(plan.canViewPipeline ? [{ id: 'pipeline' as SubTab, label: 'Pipeline' }] : []),
    ...(plan.canViewStats ? [{ id: 'statistik' as SubTab, label: 'Statistik' }] : []),
  ]

  return (
    <div className="space-y-4">
      <MailConnector />

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {subTabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
              subTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'skicka' && (
        <SendPanel result={result} prospectName={prospectName} prospectEmail={prospectEmail} />
      )}
      {subTab === 'sekvenser' && (
        plan.canAutoFollowUp
          ? <SequenceBuilder />
          : <LockedFeature planNeeded="Pro" feature="Uppföljningssekvenser" />
      )}
      {subTab === 'logg' && <OutboxView />}
      {subTab === 'pipeline' && <PipelineView />}
      {subTab === 'statistik' && <StatsView />}
    </div>
  )
}
