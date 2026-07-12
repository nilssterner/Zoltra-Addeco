import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { queryOne, query } from '@/lib/db'
import { ConnectedAccount } from '@/lib/db/types'
import { sendMail } from '@/lib/mail/sender'
import { PLANS } from '@/lib/plans'
import {
  deserializeQuota, applyReset, checkMailQuota, serializeQuota,
  DEFAULT_QUOTA, QUOTA_COOKIE, QUOTA_COOKIE_MAX_AGE,
} from '@/lib/quota'

function quotaCookieOpts() {
  return { path: '/', maxAge: QUOTA_COOKIE_MAX_AGE, sameSite: 'lax' as const, httpOnly: false }
}

export async function POST(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session hittades' }, { status: 401 })

  // ── Plancheck (server-side) ──────────────────────────────────────────────
  const rawQuota = req.cookies.get(QUOTA_COOKIE)?.value
  const quota = applyReset(rawQuota ? deserializeQuota(rawQuota) : { ...DEFAULT_QUOTA })
  const plan = PLANS[quota.planId]

  if (!plan.canSendEmail) {
    return NextResponse.json(
      { error: `Utskick ingår inte i ${plan.name}-planen. Uppgradera till Pro eller Pro Max för att skicka mail.` },
      { status: 402 }
    )
  }

  const quotaCheck = checkMailQuota(quota)
  if (!quotaCheck.ok) {
    return NextResponse.json({ error: quotaCheck.error }, { status: 402 })
  }

  // ── Kontrollera kopplat konto ─────────────────────────────────────────────
  const account = await queryOne<ConnectedAccount>(
    'SELECT * FROM connected_accounts WHERE user_id=$1 LIMIT 1',
    [userId]
  )
  if (!account) {
    return NextResponse.json(
      { error: 'Inget mailkonto kopplat. Koppla ditt Gmail- eller Outlook-konto under Utskick-fliken.' },
      { status: 400 }
    )
  }

  const body = await req.json() as {
    to: string
    leadName: string
    subject: string
    body: string
    enrollmentId?: string
    inReplyToMessageId?: string
    inReplyToThreadId?: string
  }

  if (!body.to || !body.subject || !body.body) {
    return NextResponse.json({ error: 'Mottagare, ämne och innehåll är obligatoriska' }, { status: 400 })
  }

  try {
    const result = await sendMail({
      account,
      to: body.to,
      subject: body.subject,
      body: body.body,
      inReplyToMessageId: body.inReplyToMessageId,
      inReplyToThreadId: body.inReplyToThreadId,
    })

    // Logga utskicket
    await query(
      `INSERT INTO outbox (user_id, enrollment_id, lead_email, lead_name, subject, body, status, thread_id, message_id, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7, $8, NOW())`,
      [userId, body.enrollmentId ?? null, body.to, body.leadName ?? '', body.subject, body.body, result.threadId, result.messageId]
    )

    // Räkna upp mailkvot
    const updatedQuota = { ...quota, mailUsed: quota.mailUsed + 1 }
    const res = NextResponse.json({ ok: true, ...result, quota: updatedQuota })
    res.cookies.set(QUOTA_COOKIE, serializeQuota(updatedQuota), quotaCookieOpts())
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Okänt fel'
    await query(
      'INSERT INTO outbox (user_id, lead_email, lead_name, subject, body, status) VALUES ($1,$2,$3,$4,$5,\'failed\')',
      [userId, body.to, body.leadName ?? '', body.subject, body.body]
    ).catch(() => null)
    return NextResponse.json({ error: `Utskick misslyckades: ${msg}` }, { status: 500 })
  }
}
