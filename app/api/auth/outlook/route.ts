import { NextRequest, NextResponse } from 'next/server'
import { outlookAuthUrl, MICROSOFT_CLIENT_ID } from '@/lib/mail/oauth'
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from '@/lib/db/session'

export async function GET(req: NextRequest) {
  if (!MICROSOFT_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Outlook OAuth är inte konfigurerat. Lägg till MICROSOFT_CLIENT_ID i .env.local' },
      { status: 501 }
    )
  }

  let userId = req.cookies.get(SESSION_COOKIE)?.value
  if (!userId) userId = crypto.randomUUID()

  const url = outlookAuthUrl(userId)
  const res = NextResponse.redirect(url)
  res.cookies.set(SESSION_COOKIE, userId, SESSION_COOKIE_OPTS)
  return res
}
