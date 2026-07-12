import { Pool } from 'pg'

// TODO: sätt DATABASE_URL i .env.local (t.ex. Supabase connection string)
// Format: postgres://user:password@host:5432/database?sslmode=require
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
  console.warn('[zoltra] DATABASE_URL saknas – DB-funktioner inaktiverade')
}

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (!pool) throw new Error('Databas ej konfigurerad. Lägg till DATABASE_URL i .env.local')
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
