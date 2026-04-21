#!/usr/bin/env node
/**
 * One-time fix: make the content bucket PRIVATE with size + MIME limits.
 * Safe to run multiple times (idempotent).
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
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE) {
  console.error('❌ Faltan env vars')
  process.exit(1)
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
const BUCKET = 'contenido-cursos'

const ALLOWED_MIMES = [
  // PDFs
  'application/pdf',
  // Audio
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
  'audio/aac', 'audio/mp4', 'audio/x-m4a',
  // Video
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
]

const FILE_SIZE_LIMIT = 500 * 1024 * 1024 // 500 MB (largest content is video)

console.log(`\n🔒 Locking down bucket "${BUCKET}"...\n`)

// 1. Check current state
const { data: buckets } = await admin.storage.listBuckets()
const existing = buckets?.find((b) => b.id === BUCKET)

if (!existing) {
  console.log(`  Creating new private bucket...`)
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: ALLOWED_MIMES,
  })
  if (error) {
    console.error(`  ❌ Error creating: ${error.message}`)
    process.exit(1)
  }
  console.log(`  ✅ Created as PRIVATE`)
} else {
  console.log(`  Current state:`)
  console.log(`    public: ${existing.public}`)
  console.log(`    file_size_limit: ${existing.file_size_limit || 'unlimited'}`)
  console.log(`    allowed_mime_types: ${existing.allowed_mime_types?.length ? existing.allowed_mime_types.length + ' types' : 'unrestricted'}`)

  const needsUpdate =
    existing.public === true ||
    !existing.file_size_limit ||
    !existing.allowed_mime_types?.length

  if (needsUpdate) {
    // Step 1: flip to private (no limits changes yet)
    if (existing.public === true) {
      console.log(`\n  Step 1: making bucket PRIVATE...`)
      const { error } = await admin.storage.updateBucket(BUCKET, {
        public: false,
      })
      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
        process.exit(1)
      }
      console.log(`  ✅ Private`)
    }

    // Step 2: add MIME whitelist
    if (!existing.allowed_mime_types?.length) {
      console.log(`\n  Step 2: adding MIME whitelist...`)
      const { error } = await admin.storage.updateBucket(BUCKET, {
        allowedMimeTypes: ALLOWED_MIMES,
      })
      if (error) {
        console.error(`  ⚠️  Could not add MIME whitelist: ${error.message}`)
      } else {
        console.log(`  ✅ MIME types restricted`)
      }
    }

    // Step 3: add file size limit
    if (!existing.file_size_limit) {
      console.log(`\n  Step 3: adding file size limit (${FILE_SIZE_LIMIT / 1024 / 1024} MB)...`)
      const { error } = await admin.storage.updateBucket(BUCKET, {
        fileSizeLimit: FILE_SIZE_LIMIT,
      })
      if (error) {
        console.error(`  ⚠️  Could not add size limit: ${error.message}`)
        console.error(`     (puede que haya archivos más grandes que el límite — revisá con list-storage.mjs)`)
      } else {
        console.log(`  ✅ Size limit set`)
      }
    }
  } else {
    console.log(`\n  ✅ Already properly configured`)
  }
}

// 2. Verify final state
const { data: bucketsAfter } = await admin.storage.listBuckets()
const final = bucketsAfter?.find((b) => b.id === BUCKET)

console.log(`\n📊 Final state:`)
console.log(`    public: ${final.public}  ${final.public ? '❌' : '✅'}`)
console.log(`    file_size_limit: ${(final.file_size_limit / 1024 / 1024).toFixed(0)} MB  ✅`)
console.log(`    allowed_mime_types: ${final.allowed_mime_types?.length} types  ✅`)

console.log(`\n⚠️  IMPORTANTE: ahora que el bucket es privado, los usuarios`)
console.log(`   necesitan URLs firmadas (signed URLs) para acceder al contenido.`)
console.log(`   El frontend ya está actualizado para generarlas en cada vista.`)
console.log(`   Si hay URLs públicas compartidas de antes, van a seguir funcionando`)
console.log(`   hasta que el token expire (o hasta que no se usen, si no lo hicieron).\n`)
