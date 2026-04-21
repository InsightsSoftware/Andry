#!/usr/bin/env node
/**
 * Run all the setup needed for CSV backups:
 * 1. Apply migration 00013 (the csv_backups table)
 * 2. Update the content bucket to include text/csv in allowed MIME types
 */

import { createClient } from '@supabase/supabase-js'
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

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// ── 1. Update bucket MIME whitelist to include CSV ────────────────

console.log('\n📦 Updating bucket MIME types to allow CSV...')
const { data: buckets } = await admin.storage.listBuckets()
const bucket = buckets?.find((b) => b.id === 'contenido-cursos')

if (!bucket) {
  console.error('❌ Bucket contenido-cursos not found')
  process.exit(1)
}

const currentMimes = bucket.allowed_mime_types || []
const newMimes = Array.from(
  new Set([
    ...currentMimes,
    'text/csv',
    'application/vnd.ms-excel', // some browsers send this for .csv
  ])
)

const { error: updErr } = await admin.storage.updateBucket('contenido-cursos', {
  allowedMimeTypes: newMimes,
})

if (updErr) {
  console.error(`⚠️  Could not update bucket MIME types: ${updErr.message}`)
} else {
  console.log(`✅ Bucket MIME whitelist now has ${newMimes.length} types`)
}

// ── 2. Verify csv_backups table exists ────────────────────────────

console.log('\n🔍 Checking csv_backups table...')
const { error: tableErr } = await admin
  .from('csv_backups')
  .select('*', { count: 'exact', head: true })

if (tableErr) {
  console.error('❌ Table csv_backups NOT found. Run migration 00013 in Supabase SQL Editor:')
  console.error('   supabase/migrations/00013_create_csv_backups.sql')
  process.exit(1)
}

console.log('✅ Table csv_backups exists')
console.log('\n🎉 CSV backups setup complete.')
