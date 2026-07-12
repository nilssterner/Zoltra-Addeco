import { NextRequest, NextResponse } from 'next/server'
import { gmailAuthUrl, GOOGLE_CLIENT_ID } from '@/lib/mail/oauth'
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from '@/lib/db/session'

export async function GET(req: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Gmail OAuth är inte konfigurerat. Lägg till GOOGLE_CLIENT_ID i .env.local' },
      { status: 501 }
    )
  }

  let userId = req.cookies.get(SESSION_COOKIE)?.value
  if (!userId) userId = crypto.randomUUID()

  // state = user_id för att identifiera användaren i callback
  const url = gmailAuthUrl(userId)
  const res = NextResponse.redirect(url)
  res.cookies.set(SESSION_COOKIE, userId, SESSION_COOKIE_OPTS)
  return res
}
