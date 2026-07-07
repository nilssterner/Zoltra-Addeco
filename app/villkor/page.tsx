import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Användarvillkor – Zoltra',
}

export default function VillkorPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center">
        <Link href="/" className="font-semibold text-slate-900 text-sm hover:text-blue-600 transition-colors">
          ← Tillbaka till Zoltra
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Användarvillkor</h1>
        <p className="text-sm text-slate-400 mb-8">Beta-version – uppdateras löpande</p>

        <div className="prose prose-slate prose-sm max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Tjänstens syfte</h2>
            <p>
              Zoltra är ett AI-stött verktyg för lokal B2B-outreach. Tjänsten hjälper dig att hitta potentiella kunder och skapa förslag på personliga säljmail. Alla mailtexter är förslag som du granskar och väljer att använda eller inte.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Acceptabel användning</h2>
            <p>Du förbinder dig att använda Zoltra på ett ansvarsfullt och lagligt sätt. Det är inte tillåtet att:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>använda tjänsten för massutskick eller spam</li>
              <li>kontakta privatpersoner utan laglig grund under GDPR</li>
              <li>använda genererade texter i vilseledande eller bedräglig kommunikation</li>
              <li>försöka kringgå tekniska begränsningar i tjänsten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Ansvarsbegränsning</h2>
            <p>
              Zoltra tillhandahåller mailförslag och leadinformation som ett stöd, inte som juridisk eller affärsmässig rådgivning. Vi garanterar inte att genererade texter är optimala eller lämpliga för ditt specifika syfte. Du ansvarar alltid för innehållet i din kommunikation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Beta-tjänst</h2>
            <p>
              Zoltra befinner sig i beta-fas. Tjänsten kan förändras, avbrytas eller uppdateras utan förvarning. Vi strävar efter att informera om väsentliga förändringar via tjänstens gränssnitt.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Kontakt</h2>
            <p>
              Frågor om villkoren skickas till{' '}
              <a href="mailto:kontakt@zoltra.se" className="text-blue-600 hover:underline">kontakt@zoltra.se</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
