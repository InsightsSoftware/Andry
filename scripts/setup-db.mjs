// Setup script: runs all SQL migrations against Supabase
// Usage: node scripts/setup-db.mjs

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations')

// Load from .env.local (or set these env vars before running)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Tip: run with `node --env-file=.env.local scripts/setup-db.mjs`')
  process.exit(1)
}

async function runSQL(sql, label) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    // Try the pg endpoint instead
    const pgRes = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!pgRes.ok) {
      const text = await pgRes.text().catch(() => 'no body')
      console.error(`  FAILED [${label}]: ${pgRes.status} - ${text}`)
      return false
    }
  }

  console.log(`  OK [${label}]`)
  return true
}

async function main() {
  console.log('Running migrations against Supabase...\n')

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  // Combine all migrations into one SQL string
  let allSQL = ''
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
    allSQL += `-- Migration: ${file}\n${sql}\n\n`
    console.log(`  Loaded: ${file}`)
  }

  console.log(`\nTotal: ${files.length} migrations loaded`)
  console.log('Combined SQL length:', allSQL.length, 'characters\n')

  // Write combined SQL for manual use if API fails
  const { writeFileSync } = await import('fs')
  const outPath = join(__dirname, '..', 'supabase', 'combined-migrations.sql')
  writeFileSync(outPath, allSQL)
  console.log(`Combined SQL saved to: supabase/combined-migrations.sql`)
  console.log('You can paste this in Supabase SQL Editor if needed.\n')

  // Try to run via API
  const success = await runSQL(allSQL, 'all-migrations')
  if (!success) {
    console.log('\nAPI execution failed (expected for DDL on REST API).')
    console.log('Please run the SQL manually:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Click "New query"')
    console.log('3. Paste the contents of supabase/combined-migrations.sql')
    console.log('4. Click "Run"\n')
  }
}

main().catch(console.error)
