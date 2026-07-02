import { FormData } from './types'

export function buildSalesEmailPrompt(data: FormData, leadContext?: string): string {
  const langInstruction = data.language === 'Svenska'
    ? 'Skriv ALLT på svenska.'
    : 'Write EVERYTHING in English.'

  const lengthInstruction = data.length === 'Kort'
    ? 'Keep each email under 120 words. Be punchy and concise.'
    : 'Each email can be up to 200 words. Allow slightly more context.'

  const leadContextBlock = leadContext?.trim()
    ? `
DISCOVERED LEAD CONTEXT:
${leadContext}

Use this information as a starting point for the outreach. Do not invent facts beyond what is written here.
`
    : ''

  return `You are an expert B2B sales copywriter helping small and medium Swedish businesses with cold outreach.

${langInstruction}
${lengthInstruction}

SENDER COMPANY:
- Name: ${data.companyName}
- What they do: ${data.companyDescription}
- Product/Service: ${data.productService}
- Primary audience: ${data.targetAudience}
- Based in: ${data.companyCity || 'Not provided'}

PROSPECT:
- Company: ${data.prospectName}
- Website: ${data.prospectWebsite || 'Not provided'}
- Industry: ${data.prospectIndustry}
- Likely problem/need: ${data.prospectProblem || 'Not specified'}
${leadContextBlock}
EMAIL SETTINGS:
- Tone: ${data.tone}
- Call-to-action: ${data.cta}

RULES:
- Write like a real human, not a marketing bot
- Be specific and sales-oriented WITHOUT being spammy
- Tailor each email to the prospect's industry and likely needs
- Never make up facts about the prospect
- If no website was provided, base everything only on the info above
- Avoid exaggerated claims ("revolutionize", "game-changer", etc.)
- Create genuine variation between the 3 email drafts
- Focus on relevant business value for the prospect
- Subject lines must be short (max 8 words), curiosity-driven, not clickbait
- LinkedIn message: max 60 words, casual but professional
- Follow-up: reference the first email, add a soft nudge, max 80 words

Return ONLY valid JSON — no markdown, no backticks, no explanation. Use this exact structure:

{
  "customerAnalysis": "2-3 sentence analysis of the prospect based on available info",
  "subjectLines": [
    "Subject line 1",
    "Subject line 2",
    "Subject line 3"
  ],
  "emails": [
    {
      "title": "Kort och direkt",
      "body": "Email body..."
    },
    {
      "title": "Personlig och relevant",
      "body": "Email body..."
    },
    {
      "title": "Värdebaserad",
      "body": "Email body..."
    }
  ],
  "linkedinMessage": "LinkedIn message text...",
  "followUpEmail": "Follow-up email text..."
}`
}
