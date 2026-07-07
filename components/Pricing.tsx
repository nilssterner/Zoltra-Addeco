import { PLANS } from '@/lib/plans'

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

const PLAN_ORDER = ['free', 'start', 'pro', 'pro_max'] as const

export default function Pricing() {
  return (
    <section id="pris" className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Välj din plan</h2>
          <p className="text-slate-500 text-sm sm:text-base">
            Börja gratis. Uppgradera när du vill växa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_ORDER.map(planId => {
            const plan = PLANS[planId]
            const isHighlighted = plan.badge != null

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border flex flex-col overflow-hidden ${
                  isHighlighted ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                }`}
              >
                {plan.badge && (
                  <div className="bg-blue-600 text-white text-xs font-semibold text-center py-1.5 tracking-wide">
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div className={`px-5 pt-5 pb-4 ${isHighlighted ? 'bg-blue-600' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isHighlighted ? 'text-blue-200' : 'text-slate-400'}`}>
                    {plan.name}
                  </p>
                  {plan.price === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>0 kr</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>
                        {plan.price.toLocaleString('sv-SE')} kr
                      </span>
                      <span className={`text-sm ${isHighlighted ? 'text-blue-200' : 'text-slate-400'}`}>/mån</span>
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${isHighlighted ? 'text-blue-200' : 'text-slate-400'}`}>
                    {plan.isOneTime ? 'Engångskvot – återställs ej' : 'Kvot återställs månadsvis'}
                  </p>
                </div>

                {/* Quota highlight */}
                <div className="px-5 py-3 border-b border-slate-100 bg-white">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Leads</span>
                    <span className="font-semibold text-slate-900">{plan.leadsQuota.toLocaleString('sv-SE')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                    <span>Mailförslag</span>
                    <span className="font-semibold text-slate-900">{plan.mailQuota.toLocaleString('sv-SE')}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="px-5 py-4 flex-1 bg-white">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckIcon />
                        <span className="text-xs text-slate-700">{f}</span>
                      </li>
                    ))}
                    {!plan.canSendEmail && (
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-xs text-slate-400">Mailgenerering ej tillgänglig</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5 bg-white">
                  {plan.price === 0 ? (
                    <a
                      href="#app"
                      className="block w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                    >
                      Kom igång gratis
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                        isHighlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                      // TODO: koppla till betalflöde (Stripe, Klarna el. liknande)
                      onClick={() => alert('Betalning kommer snart. Registrera dig för att bli notifierad när det är klart.')}
                    >
                      Välj {plan.name}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Alla priser exkl. moms. Inga bindningstider. Avsluta när du vill.
        </p>
      </div>
    </section>
  )
}
