-- Zoltra – Postgres-schema
-- Kör med: psql $DATABASE_URL -f lib/db/schema.sql
-- Eller via Supabase SQL-editor.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- för gen_random_uuid()

-- ─── Kopplade mailkonton ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connected_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,          -- från session-cookie (zoltra_uid)
  provider      TEXT NOT NULL,          -- 'gmail' | 'outlook'
  email         TEXT NOT NULL,
  access_token  TEXT NOT NULL,          -- TODO: kryptera i vila
  refresh_token TEXT,                   -- TODO: kryptera i vila
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_conn_user ON connected_accounts (user_id);

-- ─── Utskickslogg ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outbox (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,
  enrollment_id  UUID,                  -- NULL om manuellt skickat
  lead_email     TEXT NOT NULL,
  lead_name      TEXT NOT NULL DEFAULT '',
  subject        TEXT NOT NULL,
  body           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'sent',  -- 'sent' | 'failed' | 'replied'
  thread_id      TEXT,                  -- Gmail thread-id för svarsdetektering
  message_id     TEXT,                  -- RFC 2822 Message-ID
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_outbox_user      ON outbox (user_id);
CREATE INDEX IF NOT EXISTS idx_outbox_enrollment ON outbox (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_outbox_thread    ON outbox (thread_id);

-- ─── Uppföljningssekvenser ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sequences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  steps      JSONB NOT NULL DEFAULT '[]',
  -- Stegformat: [{ "delay_days": 0, "subject": "...", "body": "..." }]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seq_user ON sequences (user_id);

-- ─── Enrollments (lead enrollerat i sekvens) ────────────────────────────────
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id  UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  lead_email   TEXT NOT NULL,
  lead_name    TEXT NOT NULL DEFAULT '',
  current_step INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'replied' | 'completed' | 'cancelled'
  next_send_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enroll_user    ON sequence_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_seq     ON sequence_enrollments (sequence_id);
CREATE INDEX IF NOT EXISTS idx_enroll_status  ON sequence_enrollments (status, next_send_at);

-- ─── Lead-kontakter / pipeline ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  company    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'ny',
  -- 'ny' | 'kontaktad' | 'svarat' | 'möte_bokat' | 'avböjt'
  notes      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_user ON lead_contacts (user_id);
