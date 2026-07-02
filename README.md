# Zoltra-Addeco

> Create personal B2B outreach emails in seconds.

AI-driven email generator for local B2B sales. Fill in your company info and a prospect, and get 3 tailored cold emails, subject lines, a LinkedIn message, and a follow-up — instantly.

---

## 1. Installation

```bash
npm install
```

## 2. API-nycklar

Kopiera `.env.example` och lägg in dina nycklar:

```bash
cp .env.example .env.local
```

Öppna `.env.local` och fyll i:

```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_PLACES_API_KEY=...
```

- Anthropic-nyckel: [console.anthropic.com](https://console.anthropic.com)
- Google-nyckel: aktivera **Places API (New)** och **Geocoding API** för samma nyckel i [Google Cloud Console](https://console.cloud.google.com/apis/library)

## 3. Starta appen

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.

## 4. Användning

1. **Om företaget** – fyll i namn, beskrivning, produkt/tjänst och målgrupp.
2. **Hitta leads** – ange stad, bransch och avstånd. Appen söker via Google Places inom det valda avståndet från staden och rangordnar resultaten (med AI) efter hur väl de matchar din målgrupp och produkt. Klicka **Skriv mail till detta företag** på det lead du vill kontakta.
3. **Skapa mail** – mottagaren är redan ifylld om du valde ett lead. Justera ev. anledning/behov samt tonläge, längd, språk och call-to-action, klicka sedan **Generera professionellt mail**.
4. Resultaten visas direkt: kundanalys, 3 ämnesrader, 3 mailförslag, LinkedIn-meddelande och uppföljningsmail.
5. Använd **Kopiera**-knapparna för att enkelt ta med texterna.
6. **Exportera** allt som `.txt` med export-knappen.

### Tips
- Klicka **Ladda exempel** för att snabbt testa appen med exempeldata.
- De senaste 5 genereringarna sparas automatiskt i webbläsaren under formuläret.

---

## Projektstruktur

```
/app
  /api/generate-email/route.ts   ← Server-side API-route (AI-mailgenerering)
  /api/find-leads/route.ts       ← Server-side API-route (geokodning + Google Places + AI-rankning)
  page.tsx                        ← Huvudsida
  layout.tsx

/components
  LeadForm.tsx                    ← Formulär
  ResultCards.tsx                 ← Resultatkort
  CopyButton.tsx                  ← Kopiera-knapp
  HistoryPanel.tsx                ← Historik (localStorage)

/lib
  buildSalesEmailPrompt.ts        ← AI-prompt builder
  types.ts                        ← TypeScript-typer
  exampleData.ts                  ← Exempeldata
```

---

## Krav

- Node.js 18+
- Anthropic API-nyckel
- Google API-nyckel med Places API (New) och Geocoding API aktiverade
