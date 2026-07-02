import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface LeadSearchRequestBody {
  leadIndustry?: string
  leadCriteria?: string
  searchRadiusKm?: number
  searchCity?: string
  companyName?: string
  companyDescription?: string
  productService?: string
  targetAudience?: string
}

interface GeoPoint {
  lat: number
  lng: number
}

interface PlaceResponseItem {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  location?: { latitude?: number; longitude?: number }
}

interface LeadResult {
  id: string
  name: string
  address: string
  phone: string
  website: string
  email: string | null
  rating: number | null
  reviewCount: number | null
  googleMapsUrl: string
  source: string
  distanceKm: number | null
  isBestMatch: boolean
  matchReason: string | null
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const BLOCKED_EMAIL_DOMAINS = ['sentry.io', 'wixpress.com', 'example.com', 'godaddy.com', 'schema.org', 'w3.org', 'cloudflare.com', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

async function extractEmailFromWebsite(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZoltraAddecoBot/1.0)' },
    })
    clearTimeout(timeout)
    if (!res.ok) return null

    const html = await res.text()

    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (mailtoMatch) return mailtoMatch[1]

    const matches = html.match(EMAIL_REGEX)
    if (!matches) return null
    const valid = matches.find(m => !BLOCKED_EMAIL_DOMAINS.some(d => m.toLowerCase().includes(d)))
    return valid || null
  } catch {
    return null
  }
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function haversineKm(a: GeoPoint, b: GeoPoint) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

function splitIndustries(leadIndustry: string): string[] {
  const parts = leadIndustry
    .split(/,| och | eller | & |\/|;/i)
    .map(p => p.trim())
    .filter(Boolean)
  const deduped = Array.from(new Map(parts.map(p => [p.toLowerCase(), p])).values())
  return deduped.slice(0, 5)
}

async function searchPlaces(query: string, origin: GeoPoint, radiusKm: number, apiKey: string): Promise<{ places: PlaceResponseItem[]; error: string | null }> {
  const url = 'https://places.googleapis.com/v1/places:searchText'
  const requestBody = {
    textQuery: `${query} företag`,
    languageCode: 'sv',
    pageSize: 10,
    locationBias: {
      circle: {
        center: { latitude: origin.lat, longitude: origin.lng },
        // Places API hard-caps circle radius at 50km even though it's only a soft
        // bias — the real radius enforcement happens in the distance filter below.
        radius: Math.min(radiusKm, 50) * 1000,
      },
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'places.rating',
        'places.userRatingCount',
        'places.googleMapsUri',
        'places.location',
      ].join(','),
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const responseText = await response.text()
    console.error('Google Places error:', response.status, responseText || response.statusText)
    return { places: [], error: `Google Places API-fel: ${response.status} ${response.statusText}` }
  }

  const data = await response.json()
  const places: PlaceResponseItem[] = data.places ?? []
  return { places: Array.isArray(places) ? places : [], error: null }
}

async function geocode(address: string, apiKey: string): Promise<GeoPoint | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const loc = data?.results?.[0]?.geometry?.location
  if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') return null
  return { lat: loc.lat, lng: loc.lng }
}

async function rankLeadsWithClaude(
  candidates: LeadResult[],
  context: { companyName?: string; companyDescription?: string; productService?: string; targetAudience?: string; leadIndustry: string; leadCriteria?: string }
): Promise<{ order: string[]; reasons: Record<string, string> } | null> {
  if (!process.env.ANTHROPIC_API_KEY || candidates.length === 0) return null
  try {
    const list = candidates
      .map(c => `id: ${c.id}\nnamn: ${c.name}\nadress: ${c.address}\navstånd: ${c.distanceKm != null ? `${c.distanceKm.toFixed(1)} km` : 'okänt'}\nbetyg: ${c.rating ?? 'okänt'} (${c.reviewCount ?? 0} omdömen)`)
      .join('\n\n')

    const criteriaBlock = context.leadCriteria?.trim()
      ? `\n- Specifik kundbeskrivning (viktigast att matcha mot): ${context.leadCriteria.trim()}`
      : ''

    const prompt = `Du hjälper ett svenskt B2B-säljbolag att hitta det bästa möjliga säljledet bland lokala företag.

SÄLJANDE FÖRETAG:
- Namn: ${context.companyName || 'Okänt'}
- Vad de gör: ${context.companyDescription || 'Okänt'}
- Produkt/tjänst: ${context.productService || 'Okänt'}
- Målgrupp: ${context.targetAudience || 'Okänt'}
- Sökt bransch: ${context.leadIndustry}${criteriaBlock}

KANDIDATER:
${list}

Rangordna kandidaterna efter hur bra de passar som lead. Om en specifik kundbeskrivning finns ovan väger den TYNGRE än bara branschen — utgå från namn, adress och typ av verksamhet för att bedöma hur troligt det är att varje kandidat matchar den specifika beskrivningen, inte bara den generella branschen. Väg även in rimligt avstånd och gott rykte (betyg/omdömen). Returnera ENDAST giltig JSON, inga markdown-block, enligt exakt denna struktur:

{"ranking": [{"id": "...", "reason": "kort motivering, max 15 ord"}], "bestId": "..."}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as { ranking: { id: string; reason: string }[] }

    const reasons: Record<string, string> = {}
    parsed.ranking.forEach(r => { reasons[r.id] = r.reason })
    return { order: parsed.ranking.map(r => r.id), reasons }
  } catch (err) {
    console.error('Lead ranking failed, falling back to heuristic sort:', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LeadSearchRequestBody
    const leadIndustry = body.leadIndustry?.trim()
    const searchCity = body.searchCity?.trim()
    const radiusKm = Math.min(Math.max(body.searchRadiusKm || 25, 1), 9999)
    const radiusLabel = radiusKm >= 9999 ? '100+ km' : `${radiusKm} km`

    if (!leadIndustry) {
      return NextResponse.json({ leads: [], error: 'Ange en bransch att söka efter.', isMock: false }, { status: 400 })
    }
    if (!searchCity) {
      return NextResponse.json(
        { leads: [], error: 'Ange en stad att söka i.', isMock: false },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ leads: [], error: 'Google Places API-nyckel saknas.', isMock: false }, { status: 400 })
    }

    const origin = await geocode(searchCity, apiKey)
    if (!origin) {
      return NextResponse.json(
        { leads: [], error: `Kunde inte hitta staden "${searchCity}". Kontrollera stavningen.`, isMock: false },
        { status: 400 }
      )
    }

    // A free-text query treats commas/"och" as one combined phrase ("restaurang,
    // snabbmat och cafe företag" only matches places that are literally all three
    // at once, e.g. highway service stops) instead of "any of these categories".
    // So each category gets its own search, and results are merged + deduped.
    const industries = splitIndustries(leadIndustry)
    const resultsPerIndustry = await Promise.all(
      industries.map(term => searchPlaces(term, origin, radiusKm, apiKey))
    )

    if (resultsPerIndustry.every(r => r.error)) {
      return NextResponse.json(
        { leads: [], error: resultsPerIndustry[0].error, isMock: false },
        { status: 502 }
      )
    }

    const places = Array.from(
      new Map(
        resultsPerIndustry
          .flatMap(r => r.places)
          .map(place => [place.id || place.googleMapsUri || place.displayName?.text, place])
      ).values()
    )

    if (places.length === 0) {
      return NextResponse.json({ leads: [], message: 'Inga företag hittades inom valt avstånd.', isMock: false })
    }

    let leads: LeadResult[] = places
      .map(place => {
        const loc = place.location
        const distanceKm = typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number'
          ? haversineKm(origin, { lat: loc.latitude, lng: loc.longitude })
          : null
        return {
          id: place.id || place.googleMapsUri || place.displayName?.text || 'unknown',
          name: place.displayName?.text || 'Okänt företag',
          address: place.formattedAddress || '',
          phone: place.nationalPhoneNumber || '',
          website: place.websiteUri || '',
          email: null,
          rating: typeof place.rating === 'number' ? place.rating : null,
          reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
          googleMapsUrl: place.googleMapsUri || '',
          source: 'Google Places',
          distanceKm,
          isBestMatch: false,
          matchReason: null,
        }
      })
      // Defensive backstop: locationRestriction should already enforce this, but
      // never show a lead we can confirm is outside the chosen radius.
      .filter(l => l.distanceKm == null || l.distanceKm <= radiusKm)

    if (leads.length === 0) {
      return NextResponse.json({ leads: [], message: `Inga företag hittades inom ${radiusLabel} från ${searchCity}.`, isMock: false })
    }

    const [ranking] = await Promise.all([
      rankLeadsWithClaude(leads, {
        companyName: body.companyName,
        companyDescription: body.companyDescription,
        productService: body.productService,
        targetAudience: body.targetAudience,
        leadIndustry,
        leadCriteria: body.leadCriteria,
      }),
      Promise.all(leads.map(async lead => {
        if (lead.website) lead.email = await extractEmailFromWebsite(lead.website)
      })),
    ])

    if (ranking) {
      const byId = new Map(leads.map(l => [l.id, l]))
      const ordered = ranking.order.map(id => byId.get(id)).filter((l): l is LeadResult => Boolean(l))
      const remaining = leads.filter(l => !ranking.order.includes(l.id))
      leads = [...ordered, ...remaining]
      leads.forEach(l => { l.matchReason = ranking.reasons[l.id] || null })
    } else {
      leads.sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log((a.reviewCount || 0) + 2) - (a.distanceKm || 0) * 0.05
        const scoreB = (b.rating || 0) * Math.log((b.reviewCount || 0) + 2) - (b.distanceKm || 0) * 0.05
        return scoreB - scoreA
      })
    }

    if (leads.length > 0) leads[0].isBestMatch = true

    return NextResponse.json({ leads, message: `Hittade ${leads.length} företag inom ${radiusLabel}`, isMock: false })
  } catch (error) {
    console.error('Lead search error:', error)
    return NextResponse.json({ leads: [], error: 'Kunde inte hämta leaddata just nu.', isMock: false }, { status: 500 })
  }
}
