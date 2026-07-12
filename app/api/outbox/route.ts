import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { query } from '@/lib/db'
import { OutboxEntry } from '@/lib/db/types'

export async function GET(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ entries: [] })

  const entries = await query<OutboxEntry>(
    `SELECT id, lead_email, lead_name, subject, status, sent_at, created_at
     FROM outbox WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [userId]
  ).catch(() => [] as OutboxEntry[])

  return NextResponse.json({ entries })
}
