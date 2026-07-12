import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { queryOne } from '@/lib/db'
import { LeadContact, LeadStatus, LEAD_STATUSES } from '@/lib/db/types'

type Ctx = { params: Promise<{ id: string }> }

const VALID_STATUSES = LEAD_STATUSES.map(s => s.value)

export async function PUT(req: NextRequest, ctx: Ctx) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })
  const { id } = await ctx.params

  const body = await req.json() as { status: LeadStatus }
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `Ogiltig status. Tillåtna: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  const lead = await queryOne<LeadContact>(
    `UPDATE lead_contacts SET status=$3, updated_at=NOW()
     WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, body.status]
  )
  if (!lead) return NextResponse.json({ error: 'Lead hittades inte' }, { status: 404 })
  return NextResponse.json({ lead })
}
