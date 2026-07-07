import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_QUOTA,
  deserializeQuota,
  serializeQuota,
  applyReset,
  QUOTA_COOKIE,
  QUOTA_COOKIE_MAX_AGE,
} from '@/lib/quota'

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(QUOTA_COOKIE)?.value
  const quota = raw ? applyReset(deserializeQuota(raw)) : { ...DEFAULT_QUOTA }

  const res = NextResponse.json({ quota })
  res.cookies.set(QUOTA_COOKIE, serializeQuota(quota), {
    path: '/',
    maxAge: QUOTA_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: false,  // klient behöver läsa för visning; TODO: flytta till server-session vid DB-integration
  })
  return res
}
