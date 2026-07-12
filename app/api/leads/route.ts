import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { query, queryOne } from '@/lib/db'
import { LeadContact } from '@/lib/db/types'
import { PLANS } from '@/lib/plans'
import { deserializeQuota, DEFAULT_QUOTA, QUOTA_COOKIE } from '@/lib/quota'

function pipelineCheck(req: NextRequest): { ok: boolean; error?: string } {
  const raw = req.cookies.get(QUOTA_COOKIE)?.value
  const quota = raw ? deserializeQuota(raw) : { ...DEFAULT_QUOTA }
  const plan = PLANS[quota.planId]
  if (!plan.canViewPipeline) {
    return { ok: false, error: `Pipeline-vy ingår inte i ${plan.name}-planen. Uppgradera till Pro Max.` }
  }
  return { ok: true }
}

export async function GET(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ leads: [] })

  const check = pipelineCheck(req)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 402 })

  const leads = await query<LeadContact>(
    'SELECT * FROM lead_contacts WHERE user_id=$1 ORDER BY updated_at DESC',
    [userId]
  ).catch(() => [] as LeadContact[])

  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })

  const check = pipelineCheck(req)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 402 })

  const body = await req.json() as { name: string; email: string; company?: string; notes?: string }
  if (!body.name || !body.email) return NextResponse.json({ error: 'Namn och e-post krävs' }, { status: 400 })

  const lead = await queryOne<LeadContact>(
    `INSERT INTO lead_contacts (user_id, name, email, company, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, body.name, body.email, body.company ?? '', body.notes ?? '']
  )
  return NextResponse.json({ lead }, { status: 201 })
}
