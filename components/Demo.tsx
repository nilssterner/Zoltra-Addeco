const EXAMPLE_MAIL = `Hej Anna,

Jag såg att ni driver en växande webbyrå i Göteborg och tänkte att det kanske kan vara relevant.

Vi hjälper mindre företag med bokföring, löner och bokslut – särskilt bolag som växer snabbt och vill slippa lägga tid på administration.

Om ni någon gång vill jämföra hur ni arbetar med ekonomi idag tar jag gärna ett kort samtal.

Vänliga hälsningar,
[namn]`

export default function Demo() {
  return (
    <section id="demo" className="bg-slate-50 border-b border-slate-100 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Se hur ett personligt säljmail kan se ut
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm sm:text-base">
            Baserat på ditt företag och ett hittat lead genereras ett personligt first mail på sekunder.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ditt företag</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              En redovisningsbyrå i Göteborg som hjälper mindre företag med bokföring, löner och bokslut.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hittat lead</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              En växande webbyrå i Göteborg med 12 anställda.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Genererat mailförslag</span>
          </div>
          <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{EXAMPLE_MAIL}</pre>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Mailen är alltid förslag. Du granskar, ändrar och godkänner själv innan du använder dem.
        </p>
      </div>
    </section>
  )
}
