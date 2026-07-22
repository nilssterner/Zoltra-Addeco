const STEPS = [
  {
    n: '1',
    title: 'Beskriv ditt företag',
    text: 'Berätta kort vad du säljer, vem du hjälper och i vilken stad du vill hitta kunder.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    n: '2',
    title: 'Hitta relevanta leads',
    text: 'Verktyget söker fram företag som matchar din målgrupp och ditt område via Google Places.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
    ),
  },
  {
    n: '3',
    title: 'Skapa personliga mail',
    text: 'AI använder informationen om ditt företag och leadet för att skriva ett relevant, personligt första mail.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    n: '4',
    title: 'Granska och skicka',
    text: 'Du godkänner alltid mailet innan det skickas. På Pro och Pro Max skickar du direkt från appen – på Free och Start kopierar du och skickar själv.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Så fungerar det</h2>
          <p className="text-slate-500 text-sm sm:text-base">Från företagsbeskrivning till klart mailförslag på under 2 minuter.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {STEPS.map(step => (
            <div key={step.n} className="relative bg-slate-50 rounded-xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {step.n}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{step.title}</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
