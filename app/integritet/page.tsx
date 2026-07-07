import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Integritetspolicy – Zoltra',
}

export default function IntegritetPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center">
        <Link href="/" className="font-semibold text-slate-900 text-sm hover:text-blue-600 transition-colors">
          ← Tillbaka till Zoltra
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Integritetspolicy</h1>
        <p className="text-sm text-slate-400 mb-8">Senast uppdaterad: beta-version (uppdateras löpande)</p>

        <div className="prose prose-slate prose-sm max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Vilken information hanterar vi?</h2>
            <p>
              När du använder Zoltra skriver du in information om ditt eget företag – såsom företagsnamn, verksamhetsbeskrivning, produkt eller tjänst, målgrupp och stad. Denna information används uteslutande för att:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>söka fram relevanta lokala B2B-leads via Google Places</li>
              <li>generera personliga mailförslag med hjälp av AI</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Lagras mina uppgifter?</h2>
            <p>
              Under beta-perioden lagras inte din information på servern. Dina senaste genereringar sparas lokalt i din webbläsare (localStorage) och raderas om du rensar din webbläsardata. Ingen personuppgift skickas till tredje part utöver det som krävs för att utföra sökning och generering (Google Places API och Anthropic API).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Skickas mail automatiskt?</h2>
            <p>
              Nej. Zoltra genererar aldrig och skickar aldrig mail åt dig. Alla mailtexter är förslag som du som användare granskar, redigerar och väljer att använda eller inte. Du har alltid full kontroll.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Ditt ansvar som användare</h2>
            <p>
              Du ansvarar för att din användning av Zoltra följer tillämpliga lagar, inklusive GDPR och marknadsföringslagen. Zoltra ska inte användas för massutskick eller kontakt med privatpersoner utan laglig grund.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Kontakt</h2>
            <p>
              Har du frågor om hur vi hanterar information kan du kontakta oss på{' '}
              <a href="mailto:kontakt@zoltra.se" className="text-blue-600 hover:underline">kontakt@zoltra.se</a>.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Denna policy uppdateras under beta-perioden. Kontrollera regelbundet för ändringar.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
