export type Tone = 'Professionell' | 'Vänlig' | 'Direkt' | 'Premium' | 'Lokal'
export type Length = 'Kort' | 'Medium'
export type Language = 'Svenska' | 'Engelska'
export type CTA = 'Boka möte' | 'Svara på mailet' | 'Besöka hemsida' | 'Telefonsamtal'

export interface FormData {
  // Your company (Om företaget) — everything needed to find and pitch the best lead
  companyName: string
  companyDescription: string
  productService: string
  targetAudience: string
  companyCity: string
  // Lead search (Hitta leads)
  searchCity: string
  leadIndustry: string
  leadCriteria: string
  searchRadiusKm: number
  // Recipient (Skapa mail) — only what's needed to write the email
  prospectName: string
  prospectWebsite: string
  prospectIndustry: string
  prospectProblem: string
  // Settings
  tone: Tone
  length: Length
  language: Language
  cta: CTA
}

export interface EmailResult {
  title: string
  body: string
}

export interface LeadResult {
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

export interface GenerateResponse {
  customerAnalysis: string
  subjectLines: string[]
  emails: EmailResult[]
  linkedinMessage: string
  followUpEmail: string
}

export interface HistoryEntry {
  id: string
  timestamp: number
  formData: FormData
  result: GenerateResponse
}
