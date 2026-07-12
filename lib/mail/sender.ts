import { ConnectedAccount } from '@/lib/db/types'
import { refreshAccessToken } from './oauth'

export interface SendResult {
  messageId: string
  threadId: string | null
}

export interface SendOptions {
  account: ConnectedAccount
  to: string
  subject: string
  body: string
  inReplyToMessageId?: string   // RFC 2822 Message-ID för tråd-svar
  inReplyToThreadId?: string    // Gmail thread-id för svar (Gmail-specifikt)
}

// ─── RFC 2822 MIME-konstruktion ──────────────────────────────────────────────

function buildMimeMessage(from: string, to: string, subject: string, body: string, inReplyTo?: string): string {
  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ]
  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`)
    lines.push(`References: ${inReplyTo}`)
  }
  lines.push('', body)
  return lines.join('\r\n')
}

function base64url(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// ─── Gmail ──────────────────────────────────────────────────────────────────

async function sendGmail(token: string, from: string, opts: SendOptions): Promise<SendResult> {
  const mime = buildMimeMessage(from, opts.to, opts.subject, opts.body, opts.inReplyToMessageId)
  const payload: Record<string, unknown> = { raw: base64url(mime) }
  if (opts.inReplyToThreadId) payload.threadId = opts.inReplyToThreadId

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gmail-utskick misslyckades: ${err?.error?.message ?? res.statusText}`)
  }
  const data = await res.json()
  return { messageId: data.id, threadId: data.threadId ?? null }
}

// ─── Outlook ────────────────────────────────────────────────────────────────

async function sendOutlook(token: string, opts: SendOptions): Promise<SendResult> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: 'Text', content: opts.body },
        toRecipients: [{ emailAddress: { address: opts.to } }],
      },
      saveToSentItems: true,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Outlook-utskick misslyckades: ${err?.error?.message ?? res.statusText}`)
  }
  // Outlook sendMail returnerar 202 utan body – messageId ej tillgängligt direkt
  // TODO: sök efter skickat meddelande via GET /me/mailFolders/SentItems/messages för att hämta threadId
  return { messageId: `outlook-${Date.now()}`, threadId: null }
}

// ─── Publik API ──────────────────────────────────────────────────────────────

export async function sendMail(opts: SendOptions): Promise<SendResult> {
  const token = await refreshAccessToken(opts.account)

  if (opts.account.provider === 'gmail') {
    return sendGmail(token, opts.account.email, opts)
  } else {
    return sendOutlook(token, opts)
  }
}
