import { PLANS, PlanId, DEFAULT_PLAN_ID } from './plans'

export interface UserQuota {
  planId: PlanId
  leadsUsed: number
  mailUsed: number
  lastReset: string        // ISO 8601 – datum för senaste månadsåterställning
  extraLeadsQuota: number  // TODO: koppla till köpflöde för tillägg
  extraMailQuota: number   // TODO: koppla till köpflöde för tillägg
}

export const DEFAULT_QUOTA: UserQuota = {
  planId: DEFAULT_PLAN_ID,
  leadsUsed: 0,
  mailUsed: 0,
  lastReset: new Date().toISOString(),
  extraLeadsQuota: 0,
  extraMailQuota: 0,
}

export const QUOTA_COOKIE = 'zoltra_quota'
export const QUOTA_COOKIE_MAX_AGE = 60 * 60 * 24 * 400  // ~13 månader

// ─── Hjälpfunktioner ────────────────────────────────────────────────────────

export function leadsLimit(quota: UserQuota): number {
  return PLANS[quota.planId].leadsQuota + quota.extraLeadsQuota
}

export function mailLimit(quota: UserQuota): number {
  return PLANS[quota.planId].mailQuota + quota.extraMailQuota
}

export function leadsLeft(quota: UserQuota): number {
  return Math.max(0, leadsLimit(quota) - quota.leadsUsed)
}

export function mailLeft(quota: UserQuota): number {
  return Math.max(0, mailLimit(quota) - quota.mailUsed)
}

/** Ska kvoten återställas? (30 dagar sedan lastReset, ej aktuellt för engångsplaner) */
export function shouldReset(quota: UserQuota): boolean {
  const plan = PLANS[quota.planId]
  if (plan.isOneTime) return false
  const diff = Date.now() - new Date(quota.lastReset).getTime()
  return diff >= 30 * 24 * 60 * 60 * 1000  // 30 dagar i ms
}

/** Applicera månadsåterställning om det är dags. */
export function applyReset(quota: UserQuota): UserQuota {
  if (!shouldReset(quota)) return quota
  return { ...quota, leadsUsed: 0, mailUsed: 0, lastReset: new Date().toISOString() }
}

// ─── Validering (körs på servern INNAN åtgärd) ──────────────────────────────

export function checkLeadsQuota(quota: UserQuota): { ok: boolean; error?: string } {
  if (quota.leadsUsed >= leadsLimit(quota)) {
    const limit = leadsLimit(quota)
    const plan = PLANS[quota.planId]
    const suffix = plan.isOneTime
      ? 'Din engångskvot är slut.'
      : `Du har använt månadens ${limit} leadsökningar.`
    return {
      ok: false,
      error: `${suffix} Uppgradera din plan för att fortsätta.`,
    }
  }
  return { ok: true }
}

export function checkMailQuota(quota: UserQuota): { ok: boolean; error?: string } {
  const plan = PLANS[quota.planId]
  // canSendEmail avser nu faktiskt UTSKICK via kopplat konto – inte mailgenerering.
  // Alla planer kan generera mailtext; kvoten kontrolleras separat nedan.
  if (quota.mailUsed >= mailLimit(quota)) {
    const limit = mailLimit(quota)
    const suffix = plan.isOneTime
      ? 'Din engångskvot är slut.'
      : `Du har använt månadens ${limit} mailförslag.`
    return {
      ok: false,
      error: `${suffix} Uppgradera din plan eller köp till fler.`,
    }
  }
  return { ok: true }
}

// ─── Cookie-serialisering ────────────────────────────────────────────────────

export function serializeQuota(quota: UserQuota): string {
  return encodeURIComponent(JSON.stringify(quota))
}

export function deserializeQuota(raw: string): UserQuota {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<UserQuota>
    return {
      planId: (parsed.planId && parsed.planId in PLANS) ? parsed.planId as PlanId : DEFAULT_PLAN_ID,
      leadsUsed: typeof parsed.leadsUsed === 'number' ? parsed.leadsUsed : 0,
      mailUsed: typeof parsed.mailUsed === 'number' ? parsed.mailUsed : 0,
      lastReset: parsed.lastReset ?? new Date().toISOString(),
      extraLeadsQuota: typeof parsed.extraLeadsQuota === 'number' ? parsed.extraLeadsQuota : 0,
      extraMailQuota: typeof parsed.extraMailQuota === 'number' ? parsed.extraMailQuota : 0,
    }
  } catch {
    return { ...DEFAULT_QUOTA }
  }
}
