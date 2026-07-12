import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { ConnectedAccount, SequenceEnrollment, Sequence, SequenceStep } from '@/lib/db/types'
import { sendMail } from '@/lib/mail/sender'

// TODO: sätt CRON_SECRET i .env.local och i Vercel Environment Variables
// Vercel Cron skickar Authorization: Bearer <CRON_SECRET>
function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true  // Tillåt anrop lokalt om secret ej satt
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Vercel Cron-jobb – körs var 5:e minut.
 * Skickar väntande uppföljningsmejl för aktiva enrollments.
 * TODO: driftsätt som Vercel Cron via vercel.json:
 *   { "crons": [{ "path": "/api/cron/followups", "schedule": "* /5 * * * *" }] }
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: 'Ej auktoriserat' }, { status: 401 })

  // Hämta alla enrollments som ska processas nu
  const due = await query<SequenceEnrollment & { steps: SequenceStep[]; sequence_name: string; user_id: string }>(
    `SELECT e.*, s.steps, s.name AS sequence_name
     FROM sequence_enrollments e
     JOIN sequences s ON s.id = e.sequence_id
     WHERE e.status = 'active' AND e.next_send_at <= NOW()
     LIMIT 50`,
    []
  ).catch(() => [])

  let processed = 0
  let failed = 0

  for (const enrollment of due) {
    try {
      const steps: SequenceStep[] = Array.isArray(enrollment.steps) ? enrollment.steps : []
      const stepIndex = enrollment.current_step

      if (stepIndex >= steps.length) {
        // Inga fler steg – markera klart
        await query(`UPDATE sequence_enrollments SET status='completed' WHERE id=$1`, [enrollment.id])
        continue
      }

      const step = steps[stepIndex]

      // Hämta kopplat mailkonto för den här användaren
      const account = await queryOne<ConnectedAccount>(
        'SELECT * FROM connected_accounts WHERE user_id=$1 LIMIT 1',
        [enrollment.user_id]
      )
      if (!account) {
        console.warn(`[cron/followups] Inget kopplat mailkonto för user ${enrollment.user_id}`)
        continue
      }

      const sendResult = await sendMail({
        account,
        to: enrollment.lead_email,
        subject: step.subject,
        body: step.body,
      })

      // Logga utskick
      await query(
        `INSERT INTO outbox (user_id, enrollment_id, lead_email, lead_name, subject, body, status, thread_id, message_id, sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,'sent',$7,$8,NOW())`,
        [enrollment.user_id, enrollment.id, enrollment.lead_email, enrollment.lead_name, step.subject, step.body, sendResult.threadId, sendResult.messageId]
      )

      const nextStep = stepIndex + 1
      if (nextStep < steps.length) {
        const nextDelayMs = (steps[nextStep].delay_days ?? 1) * 24 * 60 * 60 * 1000
        const nextSendAt = new Date(Date.now() + nextDelayMs).toISOString()
        await query(
          `UPDATE sequence_enrollments SET current_step=$2, next_send_at=$3 WHERE id=$1`,
          [enrollment.id, nextStep, nextSendAt]
        )
      } else {
        await query(`UPDATE sequence_enrollments SET status='completed' WHERE id=$1`, [enrollment.id])
      }
      processed++
    } catch (err) {
      console.error(`[cron/followups] Fel för enrollment ${enrollment.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({ processed, failed, total: due.length })
}
