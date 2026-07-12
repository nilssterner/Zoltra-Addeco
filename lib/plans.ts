export type PlanId = 'free' | 'start' | 'pro' | 'pro_max'

export interface Plan {
  id: PlanId
  name: string
  price: number
  leadsQuota: number
  mailQuota: number
  isOneTime: boolean
  /** Kan faktiskt SKICKA mail via kopplat mailkonto. false = generera text att kopiera. */
  canSendEmail: boolean
  /** Kan skapa och köra automatiska uppföljningssekvenser. */
  canAutoFollowUp: boolean
  /** Kan se och hantera leadpipeline. */
  canViewPipeline: boolean
  /** Kan se statistik (svarsfrekvens, mötesspårning). */
  canViewStats: boolean
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
    canSendEmail: false,
    canAutoFollowUp: false,
    canViewPipeline: false,
    canViewStats: false,
    features: [
      '10 leadsökningar (engångskvot)',
      '15 mailförslag att kopiera (engångskvot)',
      'Kvoten återställs aldrig',
      'Ingen automatisk utskickshantering',
    ],
  },
  start: {
    id: 'start',
    name: 'Start',
    price: 395,
    leadsQuota: 25,
    mailQuota: 50,
    isOneTime: false,
    canSendEmail: false,
    canAutoFollowUp: false,
    canViewPipeline: false,
    canViewStats: false,
    badge: 'Populärast',
    features: [
      '25 leadsökningar / mån',
      '50 mailförslag att kopiera / mån',
      'Kvot återställs månadsvis',
      'Ingen automatisk utskickshantering',
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
    canAutoFollowUp: true,
    canViewPipeline: false,
    canViewStats: false,
    features: [
      '100 leadsökningar / mån',
      '250 utskick / mån',
      'Utskick via ditt Gmail/Outlook',
      'Automatiska uppföljningssekvenser',
      'Stopp vid svar från leadet',
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
    canAutoFollowUp: true,
    canViewPipeline: true,
    canViewStats: true,
    features: [
      '1 000 leadsökningar / mån',
      '2 000 utskick / mån',
      'Allt i Pro',
      'Pipeline-vy per lead',
      'Statistik (svarsfrekvens, möten)',
    ],
  },
}

export const DEFAULT_PLAN_ID: PlanId = 'free'
