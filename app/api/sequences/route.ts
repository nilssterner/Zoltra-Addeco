import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { query, queryOne } from '@/lib/db'
import { Sequence, SequenceStep } from '@/lib/db/types'
import { PLANS } from '@/lib/plans'
import { deserializeQuota, DEFAULT_QUOTA, QUOTA_COOKIE } from '@/lib/quota'

function planCheck(req: NextRequest): { ok: boolean; error?: string } {
  const raw = req.cookies.get(QUOTA_COOKIE)?.value
  const quota = raw ? deserializeQuota(raw) : { ...DEFAULT_QUOTA }
  const plan = PLANS[quota.planId]
  if (!plan.canAutoFollowUp) {
    return { ok: false, error: `Uppföljningssekvenser ingår inte i ${plan.name}-planen. Uppgradera till Pro eller Pro Max.` }
  }
  return { ok: true }
}

export async function GET(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ sequences: [] })

  const sequences = await query<Sequence>(
    'SELECT * FROM sequences WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  ).catch(() => [] as Sequence[])

  return NextResponse.json({ sequences })
}

export async function POST(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })

  const check = planCheck(req)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 402 })

  const body = await req.json() as { name: string; steps: SequenceStep[] }
  if (!body.name || !Array.isArray(body.steps) || body.steps.length === 0) {
    return NextResponse.json({ error: 'Namn och minst ett steg krävs' }, { status: 400 })
  }
  if (body.steps.length > 4) {
    return NextResponse.json({ error: 'Max 4 steg per sekvens (original + 3 uppföljningar)' }, { status: 400 })
  }

  const seq = await queryOne<Sequence>(
    `INSERT INTO sequences (user_id, name, steps) VALUES ($1,$2,$3) RETURNING *`,
    [userId, body.name, JSON.stringify(body.steps)]
  )
  return NextResponse.json({ sequence: seq }, { status: 201 })
}
