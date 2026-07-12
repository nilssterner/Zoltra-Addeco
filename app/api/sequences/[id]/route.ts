import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { query, queryOne } from '@/lib/db'
import { Sequence, SequenceStep } from '@/lib/db/types'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })
  const { id } = await ctx.params
  const seq = await queryOne<Sequence>('SELECT * FROM sequences WHERE id=$1 AND user_id=$2', [id, userId])
  if (!seq) return NextResponse.json({ error: 'Sekvens hittades inte' }, { status: 404 })
  return NextResponse.json({ sequence: seq })
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.json() as { name?: string; steps?: SequenceStep[] }
  const seq = await queryOne<Sequence>(
    `UPDATE sequences SET
       name = COALESCE($3, name),
       steps = COALESCE($4, steps)
     WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, body.name ?? null, body.steps ? JSON.stringify(body.steps) : null]
  )
  if (!seq) return NextResponse.json({ error: 'Sekvens hittades inte' }, { status: 404 })
  return NextResponse.json({ sequence: seq })
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })
  const { id } = await ctx.params
  await query('DELETE FROM sequences WHERE id=$1 AND user_id=$2', [id, userId])
  return NextResponse.json({ ok: true })
}
