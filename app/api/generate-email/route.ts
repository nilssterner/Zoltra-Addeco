import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildSalesEmailPrompt } from '@/lib/buildSalesEmailPrompt'
import { FormData, GenerateResponse } from '@/lib/types'
import { PLANS } from '@/lib/plans'
import {
  DEFAULT_QUOTA,
  deserializeQuota,
  serializeQuota,
  applyReset,
  checkMailQuota,
  QUOTA_COOKIE,
  QUOTA_COOKIE_MAX_AGE,
} from '@/lib/quota'

interface GenerateRequestBody extends FormData {
  leadContext?: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function validateInput(data: FormData): string | null {
  if (!data.companyName?.trim()) return 'Företagsnamn saknas.'
  if (!data.companyDescription?.trim()) return 'Företagsbeskrivning saknas.'
  if (!data.productService?.trim()) return 'Produkt/tjänst saknas.'
  if (!data.prospectName?.trim()) return 'Kundens företagsnamn saknas.'
  return null
}

function quotaCookieOpts() {
  return { path: '/', maxAge: QUOTA_COOKIE_MAX_AGE, sameSite: 'lax' as const, httpOnly: false }
}

export async function POST(req: NextRequest) {
  try {
    const rawQuota = req.cookies.get(QUOTA_COOKIE)?.value
    const quota = applyReset(rawQuota ? deserializeQuota(rawQuota) : { ...DEFAULT_QUOTA })
    const plan = PLANS[quota.planId]

    // ── Kvotvalidering ────────────────────────────────────────────────────────
    // Free / Start: mailQuota = max antal textförslag att generera (kopiera manuellt).
    // Pro / Pro Max: textgenerering är obegränsad – kvoten gäller utskick via sendmail.
    if (!plan.canSendEmail) {
      const quotaCheck = checkMailQuota(quota)
      if (!quotaCheck.ok) {
        return NextResponse.json({ error: quotaCheck.error }, { status: 402 })
      }
    }

    const body = await req.json() as GenerateRequestBody
    const validationError = validateInput(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const prompt = buildSalesEmailPrompt(body, body.leadContext)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    let result: GenerateResponse
    try {
      result = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr, '\nRaw:', rawText)
      return NextResponse.json({ error: 'Kunde inte tolka AI-svaret. Försök igen.' }, { status: 500 })
    }

    // Räkna upp kvoten bara för Free/Start (textgenerering)
    if (!plan.canSendEmail) {
      const updatedQuota = { ...quota, mailUsed: quota.mailUsed + 1 }
      const res = NextResponse.json({ ...result, quota: updatedQuota })
      res.cookies.set(QUOTA_COOKIE, serializeQuota(updatedQuota), quotaCookieOpts())
      return res
    }

    // Pro/Pro Max: returnera resultat utan att röra mailkvoten (den spåras vid utskick)
    return NextResponse.json({ ...result, quota })
  } catch (err) {
    console.error('API route error:', err)
    return NextResponse.json(
      { error: 'Något gick fel. Kontrollera din API-nyckel och försök igen.' },
      { status: 500 }
    )
  }
}
