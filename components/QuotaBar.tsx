'use client'
import { UserQuota, leadsLimit, mailLimit } from '@/lib/quota'
import { PLANS } from '@/lib/plans'

interface QuotaBarProps {
  quota: UserQuota
}

function Bar({ used, limit, label, warn }: { used: number; limit: number; label: string; warn: boolean }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 100
  const full = pct >= 100
  const barColor = full ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className={`text-xs font-semibold ${full ? 'text-red-600' : warn ? 'text-amber-600' : 'text-slate-700'}`}>
          {full ? 'Slut' : `${limit - used} kvar`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-0.5">{used} / {limit} använda</p>
    </div>
  )
}

export default function QuotaBar({ quota }: QuotaBarProps) {
  const plan = PLANS[quota.planId]
  const lLimit = leadsLimit(quota)
  const mLimit = mailLimit(quota)
  const lUsed = quota.leadsUsed
  const mUsed = quota.mailUsed
  const lWarn = lUsed / lLimit >= 0.8
  const mWarn = mUsed / mLimit >= 0.8
  const anyWarn = lWarn || mWarn
  const lFull = lUsed >= lLimit
  const mFull = mUsed >= mLimit
  const anyFull = lFull || mFull

  // Free/Start: kvoten gäller genererade textförslag
  // Pro/Pro Max: kvoten gäller faktiska utskick via kopplat konto
  const mailLabel = plan.canSendEmail ? 'Utskick skickade' : 'Mailförslag genererade'

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${anyFull ? 'border-red-200 bg-red-50' : anyWarn ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Kvot – {plan.name}
          </span>
          {plan.isOneTime && (
            <span className="text-xs text-slate-400">(engångskvot)</span>
          )}
          {plan.canSendEmail && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Utskick aktivt</span>
          )}
        </div>
        <a href="#pris" className="text-xs text-blue-600 hover:underline">Uppgradera</a>
      </div>

      <Bar used={lUsed} limit={lLimit} label="Leadsökningar" warn={lWarn} />
      <Bar used={mUsed} limit={mLimit} label={mailLabel} warn={mWarn} />

      {anyFull && (
        <p className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">
          Du har nått din kvotgräns.{' '}
          <a href="#pris" className="font-semibold underline">Uppgradera din plan</a> för att fortsätta.
        </p>
      )}
      {!anyFull && anyWarn && (
        <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
          Du närmar dig din kvotgräns.{' '}
          <a href="#pris" className="font-semibold underline">Uppgradera</a> i god tid.
        </p>
      )}
    </div>
  )
}
