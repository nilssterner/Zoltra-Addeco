import { NextRequest, NextResponse } from 'next/server'
import { getSessionId } from '@/lib/db/session'
import { query, queryOne } from '@/lib/db'
import { ConnectedAccount } from '@/lib/db/types'

export async function GET(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ account: null })

  const account = await queryOne<ConnectedAccount>(
    'SELECT id, user_id, provider, email, expires_at, created_at FROM connected_accounts WHERE user_id=$1 LIMIT 1',
    [userId]
  ).catch(() => null)

  // Skicka aldrig tokens till klienten
  return NextResponse.json({ account: account ? { id: account.id, provider: account.provider, email: account.email } : null })
}

export async function DELETE(req: NextRequest) {
  const userId = getSessionId(req)
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })

  await query('DELETE FROM connected_accounts WHERE user_id=$1', [userId]).catch(() => null)
  return NextResponse.json({ ok: true })
}
