export default function Hero() {
  return (
    <section className="relative bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div className="inline-flex items-center gap-2 mb-7 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          Beta – gratis att använda
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
          Hitta lokala B2B-kunder och skapa<br className="hidden sm:block" /> personliga säljmail på 2 minuter
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Zoltra hjälper småföretag att hitta relevanta företag i sitt område och skapa personliga, professionella outreach-mail – utan manuell research.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <a
            href="#app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Hitta mina första leads
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Se exempel
          </a>
        </div>
        <a
          href="#app"
          className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold text-base hover:bg-slate-800 transition-colors shadow-md"
        >
          Kom igång – gratis
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <p className="mt-7 text-xs text-slate-400">
          Inga mail skickas automatiskt. Du granskar alltid texten själv.
        </p>
      </div>
    </section>
  )
}
