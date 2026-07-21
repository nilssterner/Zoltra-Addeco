const POINTS = [
  'Du granskar alltid mailen innan användning',
  'Inga mail skickas automatiskt',
  'Du kan justera ton, längd och innehåll',
  'Verktyget är till för personlig och relevant kontakt – inte massutskick',
  'Företagsinformation används endast för att skapa bättre leadförslag och mailtexter',
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Trust() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Byggt för ansvarsfull B2B-outreach</h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
            Vi tror på personlig och relevant kontakt, inte automatiserade massutskick.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {POINTS.map((point, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4">
              <CheckIcon />
              <p className="text-sm text-slate-700">{point}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">Viktig information</p>
          <p>
            Zoltra hjälper dig att skapa mailförslag. Du ansvarar själv för att din kontakt följer gällande regler, inklusive GDPR och marknadsföringslagen. Skicka aldrig massmail baserat på köpta listor.
          </p>
        </div>
      </div>
    </section>
  )
}
