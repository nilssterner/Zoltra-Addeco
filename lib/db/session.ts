import { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE = 'zoltra_uid'
export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 400,
  sameSite: 'lax' as const,
}

/** Hämtar user_id från session-cookie. Returnerar null om ingen session finns. */
export function getSessionId(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value ?? null
}

/**
 * Hämtar befintlig session eller skapar en ny UUID om ingen finns.
 * Sätter cookie på svaret om en ny skapades.
 */
export function requireSession(
  req: NextRequest,
  res: NextResponse
): string {
  const existing = req.cookies.get(SESSION_COOKIE)?.value
  if (existing) return existing
  const newId = crypto.randomUUID()
  res.cookies.set(SESSION_COOKIE, newId, SESSION_COOKIE_OPTS)
  return newId
}
