#!/usr/bin/env node
/**
 * Apply a single migration file via the Supabase REST API's SQL endpoint.
 * Usage: node scripts/apply-migration.mjs <path-to-migration.sql>
 *
 * Uses service_role so it bypasses RLS during DDL. Idempotent — the
 * migration files themselves should use `if not exists` and `drop policy
 * if exists` where possible.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY

const migrationPath = process.argv[2]
if (!migrationPath) {
  console.error('Usage: node scripts/apply-migration.mjs <path-to-migration.sql>')
  process.exit(1)
}

const sql = readFileSync(migrationPath, 'utf-8')
console.log(`📝 Applying migration: ${migrationPath}`)
console.log(`   ${sql.split('\n').length} lines`)

// Supabase doesn't expose a direct SQL endpoint over REST. We need to use
// the pg-meta endpoint that Supabase Studio uses internally.
const res = await fetch(`${URL}/pg/v1/query`, {
  method: 'POST',
  headers: {
    'apikey': SERVICE,
    'Authorization': `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

if (!res.ok) {
  const text = await res.text()
  console.error(`❌ Migration failed: ${res.status} ${res.statusText}`)
  console.error(text)
  process.exit(1)
}

const result = await res.json()
console.log('✅ Migration applied')
if (Array.isArray(result)) {
  console.log(`   ${result.length} statements executed`)
}
