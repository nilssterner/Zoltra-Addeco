export type Provider = 'gmail' | 'outlook'
export type OutboxStatus = 'sent' | 'failed' | 'replied'
export type EnrollmentStatus = 'active' | 'replied' | 'completed' | 'cancelled'
export type LeadStatus = 'ny' | 'kontaktad' | 'svarat' | 'möte_bokat' | 'avböjt'

export interface ConnectedAccount {
  id: string
  user_id: string
  provider: Provider
  email: string
  access_token: string
  refresh_token: string | null
  expires_at: Date
  created_at: Date
}

export interface OutboxEntry {
  id: string
  user_id: string
  enrollment_id: string | null
  lead_email: string
  lead_name: string
  subject: string
  body: string
  status: OutboxStatus
  thread_id: string | null
  message_id: string | null
  sent_at: Date | null
  created_at: Date
}

export interface SequenceStep {
  delay_days: number
  subject: string
  body: string
}

export interface Sequence {
  id: string
  user_id: string
  name: string
  steps: SequenceStep[]
  created_at: Date
}

export interface SequenceEnrollment {
  id: string
  sequence_id: string
  user_id: string
  lead_email: string
  lead_name: string
  current_step: number
  status: EnrollmentStatus
  next_send_at: Date
  started_at: Date
}

export interface LeadContact {
  id: string
  user_id: string
  name: string
  email: string
  company: string
  status: LeadStatus
  notes: string
  created_at: Date
  updated_at: Date
}

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'ny', label: 'Ny' },
  { value: 'kontaktad', label: 'Kontaktad' },
  { value: 'svarat', label: 'Svarat' },
  { value: 'möte_bokat', label: 'Möte bokat' },
  { value: 'avböjt', label: 'Avböjt' },
]
