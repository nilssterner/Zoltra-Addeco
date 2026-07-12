import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { ConnectedAccount, SequenceEnrollment, SequenceStep } from '@/lib/db/types'
import { sendMail } from '@/lib/mail/sender'
import { getSendCount } from '@/lib/db/sendCount'
import { PLANS } from '@/lib/plans'
import { deserializeQuota, DEFAULT_QUOTA, QUOTA_COOKIE_MAX_AGE } from '@/lib/quota'

// TODO: sätt CRON_SECRET i .env.local och Vercel Environment Variables
function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Vercel Cron-jobb – körs var 5:e minut.
 * Skickar väntande uppföljningsmail för aktiva enrollments.
 * Kontrollerar utskickskvoten via DB (ingen cookie-session tillgänglig i cron).
 *
 * Driftsättning: konfigureras automatiskt via vercel.json.
 * TODO: koppla in betalplan via DB (user_plans-tabell) när äkta auth läggs till –
 *   just nu läses planId från det krypterade quota-cookie-värdet om tillgängligt i DB.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return NextResponse.json({ error: 'Ej auktoriserat' }, { status: 401 })

  type DueRow = SequenceEnrollment & {
    steps: SequenceStep[]
    sequence_name: string
    quota_snapshot: string | null
    last_reset: string | null
  }

  const due = await query<DueRow>(
    `SELECT e.*,
            s.steps,
            s.name AS sequence_name,
            NULL   AS quota_snapshot,
            NULL   AS last_reset
     FROM sequence_enrollments e
     JOIN sequences s ON s.id = e.sequence_id
     WHERE e.status = 'active' AND e.next_send_at <= NOW()
     LIMIT 50`,
    []
  ).catch(() => [] as DueRow[])

  let processed = 0
  let skippedQuota = 0
  let failed = 0

  for (const enrollment of due) {
    try {
      const steps: SequenceStep[] = Array.isArray(enrollment.steps) ? enrollment.steps : []
      const stepIndex = enrollment.current_step

      if (stepIndex >= steps.length) {
        await query(`UPDATE sequence_enrollments SET status='completed' WHERE id=$1`, [enrollment.id])
        continue
      }

      // ── DB-baserad kvotcheck (cron har ingen cookie-session) ────────────────
      // Hämta planId från den senaste outbox-raden för användaren (indirekt heuristik).
      // TODO: ersätt med user_plans-tabell när riktig auth implementeras.
      const lastOutbox = await queryOne<{ plan_hint: string | null }>(
        `SELECT NULL AS plan_hint FROM outbox WHERE user_id=$1 LIMIT 1`,
        [enrollment.user_id]
      ).catch(() => null)

      // Försök tolka plan från cookie-snapshot om det lagrats
      // (i nuläget används free-plan som standard i cron – kvoter tillämpas konservativt)
      const quotaData = enrollment.quota_snapshot
        ? (() => { try { return deserializeQuota(enrollment.quota_snapshot!) } catch { return { ...DEFAULT_QUOTA } } })()
        : { ...DEFAULT_QUOTA }

      const plan = PLANS[quotaData.planId]
      if (!plan.canSendEmail) {
        // Planen tillåter inte utskick – avbryt enrollment
        await query(`UPDATE sequence_enrollments SET status='cancelled' WHERE id=$1`, [enrollment.id])
        skippedQuota++
        continue
      }

      const sendLimit = plan.mailQuota + quotaData.extraMailQuota
      const sendCount = await getSendCount(enrollment.user_id, quotaData.lastReset)
      if (sendCount >= sendLimit) {
        // Kvoten slut – hoppa över tills nästa återställning
        console.warn(`[cron/followups] Kvot slut för user ${enrollment.user_id} (${sendCount}/${sendLimit})`)
        skippedQuota++
        continue
      }

      // ── Hämta kopplat mailkonto ─────────────────────────────────────────────
      const account = await queryOne<ConnectedAccount>(
        'SELECT * FROM connected_accounts WHERE user_id=$1 LIMIT 1',
        [enrollment.user_id]
      )
      if (!account) {
        console.warn(`[cron/followups] Inget kopplat mailkonto för user ${enrollment.user_id}`)
        continue
      }

      const step = steps[stepIndex]
      const sendResult = await sendMail({
        account,
        to: enrollment.lead_email,
        subject: step.subject,
        body: step.body,
      })

      await query(
        `INSERT INTO outbox (user_id, enrollment_id, lead_email, lead_name, subject, body, status, thread_id, message_id, sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,'sent',$7,$8,NOW())`,
        [enrollment.user_id, enrollment.id, enrollment.lead_email, enrollment.lead_name, step.subject, step.body, sendResult.threadId, sendResult.messageId]
      )

      const nextStep = stepIndex + 1
      if (nextStep < steps.length) {
        const nextDelayMs = (steps[nextStep].delay_days ?? 1) * 24 * 60 * 60 * 1000
        await query(
          `UPDATE sequence_enrollments SET current_step=$2, next_send_at=$3 WHERE id=$1`,
          [enrollment.id, nextStep, new Date(Date.now() + nextDelayMs).toISOString()]
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

  return NextResponse.json({ processed, skippedQuota, failed, total: due.length })
}
