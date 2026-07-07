export type PlanId = 'free' | 'start' | 'pro' | 'pro_max'

export interface Plan {
  id: PlanId
  name: string
  price: number          // kr/mån; 0 = gratis
  leadsQuota: number
  mailQuota: number
  isOneTime: boolean     // true = engångskvot som aldrig återställs (Free)
  canSendEmail: boolean  // false = mailgenerering ej tillgänglig
  badge?: string
  features: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    leadsQuota: 10,
    mailQuota: 15,
    isOneTime: true,
    canSendEmail: true,
    features: [
      '10 leadsökningar (engångskvot)',
      '15 mailförslag (engångskvot)',
      'Kvoten återställs aldrig',
      'Kopiera mail manuellt',
    ],
  },
  start: {
    id: 'start',
    name: 'Start',
    price: 395,
    leadsQuota: 25,
    mailQuota: 50,
    isOneTime: false,
    canSendEmail: true,
    badge: 'Populärast',
    features: [
      '25 leadsökningar / mån',
      '50 mailförslag / mån',
      'Kvot återställs månadsvis',
      'Alla mailfunktioner',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 995,
    leadsQuota: 100,
    mailQuota: 250,
    isOneTime: false,
    canSendEmail: true,
    features: [
      '100 leadsökningar / mån',
      '250 mailförslag / mån',
      'Kvot återställs månadsvis',
      'Alla mailfunktioner',
    ],
  },
  pro_max: {
    id: 'pro_max',
    name: 'Pro Max',
    price: 2495,
    leadsQuota: 1000,
    mailQuota: 2000,
    isOneTime: false,
    canSendEmail: true,
    features: [
      '1 000 leadsökningar / mån',
      '2 000 mailförslag / mån',
      'Kvot återställs månadsvis',
      'Alla mailfunktioner',
    ],
  },
}

export const DEFAULT_PLAN_ID: PlanId = 'free'
