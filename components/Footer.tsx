export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-semibold text-white text-sm">Zoltra</p>
            <p className="text-xs mt-0.5">AI-stöd för lokal B2B-outreach</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a href="/integritet" className="hover:text-white transition-colors">Integritet</a>
            <a href="/villkor" className="hover:text-white transition-colors">Villkor</a>
            <a href="mailto:kontakt@zoltra.se" className="hover:text-white transition-colors">Kontakt</a>
          </nav>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs">
          <p>Zoltra skickar inga mail automatiskt. Du granskar och använder alltid texterna själv.</p>
          <p className="mt-2">
            Zoltra Handelsbolag skapades 2026 i Falköping, Sverige och drivs av Nils Sterner och Viggo Thorell.
            Zoltra skapades för att vi vill hjälpa mindre företag bli mer konkurrenskraftiga.
          </p>
        </div>
      </div>
    </footer>
  )
}
