import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { query, queryOne } from '@/lib/db'
import { Sequence, SequenceEnrollment } from '@/lib/db/types'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })
  const { id: sequenceId } = await ctx.params

  // Verifiera att sekvensen tillhör användaren
  const seq = await queryOne<Sequence>('SELECT * FROM sequences WHERE id=$1 AND user_id=$2', [sequenceId, userId])
  if (!seq) return NextResponse.json({ error: 'Sekvens hittades inte' }, { status: 404 })

  const body = await req.json() as { leadEmail: string; leadName?: string }
  if (!body.leadEmail) return NextResponse.json({ error: 'leadEmail krävs' }, { status: 400 })

  // Kontrollera att leadet inte redan är aktivt enrollat
  const existing = await queryOne<SequenceEnrollment>(
    `SELECT id FROM sequence_enrollments
     WHERE sequence_id=$1 AND lead_email=$2 AND status='active'`,
    [sequenceId, body.leadEmail]
  )
  if (existing) {
    return NextResponse.json({ error: 'Leadet är redan aktivt i den här sekvensen' }, { status: 409 })
  }

  // Steg 0 skickas direkt (next_send_at = nu)
  const enrollment = await queryOne<SequenceEnrollment>(
    `INSERT INTO sequence_enrollments (sequence_id, user_id, lead_email, lead_name, next_send_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [sequenceId, userId, body.leadEmail, body.leadName ?? '']
  )

  return NextResponse.json({ enrollment }, { status: 201 })
}

/** Avregistrera (avbryt) enrollment manuellt */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ error: 'Ingen session' }, { status: 401 })
  const { id: enrollmentId } = await ctx.params

  await query(
    `UPDATE sequence_enrollments SET status='cancelled'
     WHERE id=$1 AND user_id=$2`,
    [enrollmentId, userId]
  )
  return NextResponse.json({ ok: true })
}
