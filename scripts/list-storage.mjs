#!/usr/bin/env node
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function listRecursive(bucket, prefix = '') {
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) {
    console.error(`Error listing ${prefix}:`, error)
    return []
  }
  const out = []
  for (const item of data || []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name
    if (item.id === null) {
      // It's a folder
      out.push(...(await listRecursive(bucket, fullPath)))
    } else {
      out.push({ path: fullPath, size: item.metadata?.size || 0, mime: item.metadata?.mimetype })
    }
  }
  return out
}

const items = await listRecursive('contenido-cursos')
items.sort((a, b) => b.size - a.size)

console.log(`\n📦 ${items.length} archivos en bucket "contenido-cursos":\n`)
let totalSize = 0
for (const item of items) {
  const mb = (item.size / 1024 / 1024).toFixed(1)
  totalSize += item.size
  const warn = item.size > 500 * 1024 * 1024 ? '⚠️ ' : '  '
  console.log(`${warn}${String(mb).padStart(8)} MB  ${item.mime || '?'.padEnd(20)}  ${item.path}`)
}
console.log(`\nTotal: ${(totalSize / 1024 / 1024).toFixed(1)} MB`)
