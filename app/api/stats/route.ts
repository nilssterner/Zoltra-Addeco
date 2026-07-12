import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { queryOne } from '@/lib/db'
import { PLANS } from '@/lib/plans'
import { deserializeQuota, DEFAULT_QUOTA, QUOTA_COOKIE } from '@/lib/quota'

export async function GET(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })

  const raw = req.cookies.get(QUOTA_COOKIE)?.value
  const quota = raw ? deserializeQuota(raw) : { ...DEFAULT_QUOTA }
  const plan = PLANS[quota.planId]

  if (!plan.canViewStats) {
    return NextResponse.json(
      { error: `Statistik ingår inte i ${plan.name}-planen. Uppgradera till Pro Max.` },
      { status: 402 }
    )
  }

  const stats = await queryOne<{
    total_sent: string
    total_replied: string
    total_meetings: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('sent','replied'))           AS total_sent,
       COUNT(*) FILTER (WHERE status = 'replied')                    AS total_replied,
       0                                                             AS total_meetings
     FROM outbox WHERE user_id=$1`,
    [userId]
  ).catch(() => ({ total_sent: '0', total_replied: '0', total_meetings: '0' }))

  const meetingsRow = await queryOne<{ total: string }>(
    `SELECT COUNT(*) AS total FROM lead_contacts WHERE user_id=$1 AND status='möte_bokat'`,
    [userId]
  ).catch(() => ({ total: '0' }))

  const totalSent = parseInt(stats?.total_sent ?? '0')
  const totalReplied = parseInt(stats?.total_replied ?? '0')
  const totalMeetings = parseInt(meetingsRow?.total ?? '0')
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0

  return NextResponse.json({ totalSent, totalReplied, replyRate, totalMeetings })
}
