import { ConnectedAccount } from '@/lib/db/types'
import { query } from '@/lib/db'

// TODO: Registrera en Google OAuth-app på https://console.cloud.google.com
//   – Aktivera Gmail API
//   – Skapa OAuth 2.0-klient (Web application)
//   – Lägg till auktoriserad redirect URI: NEXT_PUBLIC_BASE_URL/api/auth/gmail/callback
//   – Kopiera Client ID och Client Secret till .env.local
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''

// TODO: Registrera en Azure-app på https://portal.azure.com
//   – "App registrations" → New registration
//   – Lägg till redirect URI: NEXT_PUBLIC_BASE_URL/api/auth/outlook/callback
//   – Under "API permissions": Mail.Send, Mail.Read, offline_access (delegated)
//   – Kopiera Application (client) ID och Client Secret till .env.local
export const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID ?? ''
export const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET ?? ''

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

// ─── Gmail ──────────────────────────────────────────────────────────────────

export function gmailAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/gmail/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGmailCode(code: string): Promise<{
  access_token: string; refresh_token: string; expires_in: number; email: string
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BASE_URL}/api/auth/gmail/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Gmail token exchange misslyckades: ${await res.text()}`)
  const data = await res.json()
  const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  }).then(r => r.json())
  return { ...data, email: userInfo.email }
}

// ─── Outlook ────────────────────────────────────────────────────────────────

export function outlookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/outlook/callback`,
    response_type: 'code',
    scope: 'offline_access Mail.Send Mail.Read',
    state,
  })
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
}

export async function exchangeOutlookCode(code: string): Promise<{
  access_token: string; refresh_token: string; expires_in: number; email: string
}> {
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      redirect_uri: `${BASE_URL}/api/auth/outlook/callback`,
      grant_type: 'authorization_code',
      scope: 'offline_access Mail.Send Mail.Read',
    }),
  })
  if (!res.ok) throw new Error(`Outlook token exchange misslyckades: ${await res.text()}`)
  const data = await res.json()
  const userInfo = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  }).then(r => r.json())
  return { ...data, email: userInfo.mail ?? userInfo.userPrincipalName }
}

// ─── Token-förnyelse ─────────────────────────────────────────────────────────

export async function refreshAccessToken(account: ConnectedAccount): Promise<string> {
  if (!account.refresh_token) throw new Error('Inget refresh_token – koppla om kontot')

  const isExpired = new Date(account.expires_at).getTime() - Date.now() < 60_000
  if (!isExpired) return account.access_token

  let tokenUrl: string
  let body: URLSearchParams

  if (account.provider === 'gmail') {
    tokenUrl = 'https://oauth2.googleapis.com/token'
    body = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    })
  } else {
    tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
    body = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
      scope: 'offline_access Mail.Send Mail.Read',
    })
  }

  const res = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!res.ok) throw new Error(`Token-förnyelse misslyckades: ${await res.text()}`)
  const data = await res.json()

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
  await query(
    'UPDATE connected_accounts SET access_token=$1, expires_at=$2 WHERE id=$3',
    [data.access_token, newExpiresAt, account.id]
  )
  return data.access_token
}
