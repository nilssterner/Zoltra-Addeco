import { ConnectedAccount } from '@/lib/db/types'
import { refreshAccessToken } from './oauth'

/**
 * Kontrollerar om ett Gmail-thread har fått svar från en annan avsändare
 * än det kopplade mailkontot.
 *
 * Returnerar true om svar hittats – används av cron-jobbet för att avbryta
 * uppföljningssekvenser.
 */
export async function hasGmailReply(account: ConnectedAccount, threadId: string): Promise<boolean> {
  const token = await refreshAccessToken(account)

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return false

  const data = await res.json()
  const messages: unknown[] = data.messages ?? []
  if (messages.length <= 1) return false

  // Kolla om något av meddelandena efter det första är från en annan avsändare
  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i] as { payload?: { headers?: { name: string; value: string }[] } }
    const fromHeader = msg.payload?.headers?.find(h => h.name === 'From')
    if (fromHeader && !fromHeader.value.toLowerCase().includes(account.email.toLowerCase())) {
      return true
    }
  }
  return false
}

/**
 * Outlook: Sök efter inkommande meddelanden i samma konversation.
 *
 * TODO: Outlook kräver conversationId (inte threadId). Implementera när
 * Outlook thread-id lagras i outbox-tabellen (se sendOutlook TODO i sender.ts).
 */
export async function hasOutlookReply(_account: ConnectedAccount, _conversationId: string): Promise<boolean> {
  // TODO: implementera Outlook Graph API reply-check
  // GET /me/messages?$filter=conversationId eq '{id}' and from/emailAddress/address ne '{ourEmail}'
  return false
}
