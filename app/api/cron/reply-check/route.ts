import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ConnectedAccount } from '@/lib/db/types'
import { hasGmailReply, hasOutlookReply } from '@/lib/mail/reply-detector'

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Vercel Cron-jobb – körs var 10:e minut.
 * Kontrollerar om leads har svarat och avbryter uppföljningar.
 * TODO: lägg till i vercel.json:
 *   { "path": "/api/cron/reply-check", "schedule": "* /10 * * * *" }
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: 'Ej auktoriserat' }, { status: 401 })

  // Hämta aktiva enrollments som har ett skickat mail med thread_id
  const activeWithThreads = await query<{
    enrollment_id: string
    user_id: string
    thread_id: string
    provider: string
    account: ConnectedAccount
  }>(
    `SELECT DISTINCT ON (e.id)
       e.id AS enrollment_id,
       e.user_id,
       o.thread_id,
       ca.provider,
       row_to_json(ca) AS account
     FROM sequence_enrollments e
     JOIN outbox o ON o.enrollment_id = e.id AND o.thread_id IS NOT NULL
     JOIN connected_accounts ca ON ca.user_id = e.user_id
     WHERE e.status = 'active'
     LIMIT 100`,
    []
  ).catch(() => [])

  let marked = 0

  for (const row of activeWithThreads) {
    try {
      const account = row.account as unknown as ConnectedAccount
      let replied = false

      if (row.provider === 'gmail') {
        replied = await hasGmailReply(account, row.thread_id)
      } else {
        replied = await hasOutlookReply(account, row.thread_id)
      }

      if (replied) {
        // Markera enrollment som svarat och stoppa uppföljningar
        await query(
          `UPDATE sequence_enrollments SET status='replied' WHERE id=$1`,
          [row.enrollment_id]
        )
        // Uppdatera outbox-poster för denna enrollment
        await query(
          `UPDATE outbox SET status='replied' WHERE enrollment_id=$1`,
          [row.enrollment_id]
        )
        marked++
      }
    } catch (err) {
      console.error(`[cron/reply-check] Fel för enrollment ${row.enrollment_id}:`, err)
    }
  }

  return NextResponse.json({ checked: activeWithThreads.length, markedAsReplied: marked })
}
