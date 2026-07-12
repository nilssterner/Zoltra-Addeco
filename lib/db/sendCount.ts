import { queryOne } from './index'

/**
 * Räknar antal lyckade utskick för en användare sedan ett givet datum.
 * Används av Pro/Pro Max för server-side kvotvalidering oberoende av cookie.
 */
export async function getSendCount(userId: string, since: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM outbox
     WHERE user_id = $1
       AND status IN ('sent', 'replied')
       AND sent_at >= $2`,
    [userId, since]
  ).catch(() => null)
  return parseInt(row?.count ?? '0')
}
