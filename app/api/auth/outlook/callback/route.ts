import { NextRequest, NextResponse } from 'next/server'
import { exchangeOutlookCode, BASE_URL } from '@/lib/mail/oauth'
import { query } from '@/lib/db'
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from '@/lib/db/session'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/?error=outlook_auth_misslyckades`)
  }

  try {
    const { access_token, refresh_token, expires_in, email } = await exchangeOutlookCode(code)
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    await query(
      `INSERT INTO connected_accounts (user_id, provider, email, access_token, refresh_token, expires_at)
       VALUES ($1, 'outlook', $2, $3, $4, $5)
       ON CONFLICT (user_id, provider)
       DO UPDATE SET email=$2, access_token=$3, refresh_token=$4, expires_at=$5`,
      [state, email, access_token, refresh_token, expiresAt]
    )

    const res = NextResponse.redirect(`${BASE_URL}/?connected=outlook`)
    res.cookies.set(SESSION_COOKIE, state, SESSION_COOKIE_OPTS)
    return res
  } catch (err) {
    console.error('Outlook OAuth callback fel:', err)
    return NextResponse.redirect(`${BASE_URL}/?error=outlook_auth_misslyckades`)
  }
}
