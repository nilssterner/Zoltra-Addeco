import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildSalesEmailPrompt } from '@/lib/buildSalesEmailPrompt'
import { FormData, GenerateResponse } from '@/lib/types'

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

export async function POST(req: NextRequest) {
  try {
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

    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let result: GenerateResponse
    try {
      result = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr, '\nRaw:', rawText)
      return NextResponse.json(
        { error: 'Kunde inte tolka AI-svaret. Försök igen.' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('API route error:', err)
    return NextResponse.json(
      { error: 'Något gick fel. Kontrollera din API-nyckel och försök igen.' },
      { status: 500 }
    )
  }
}
