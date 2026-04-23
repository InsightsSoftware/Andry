#!/usr/bin/env node
/**
 * Actualiza los nombres de los capítulos del curso negocios-y-finanzas
 * a los títulos oficiales del material de Andry.
 *
 * Uso: node scripts/rename-chapters.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw.split('\n').filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Oficial book TOC — titles from the user's study material
const OFFICIAL_NAMES = {
  1: 'Planificación y Organización del Negocio',
  2: 'Licencias',
  3: 'Gestión Financiera',
  4: 'Gestión de Riesgo',
  5: 'Leyes Laborales y Regulaciones de Empleo',
  6: 'Compensación Laboral',
  7: 'Seguridad OSHA',
  8: 'Contratos de Construcción y Responsabilidad',
  9: 'Ley de Gravámenes de Construcción',
  10: 'Gestión de Proyectos',
  11: 'Suplemento AIA',
  12: 'Suplemento Circular E',
}

const { data: cursos } = await admin
  .from('cursos')
  .select('id, nombre, slug')
  .eq('slug', 'negocios-y-finanzas')

if (!cursos?.length) {
  console.error('Curso "negocios-y-finanzas" no encontrado')
  process.exit(1)
}

const curso = cursos[0]
console.log(`Curso: ${curso.nombre} (${curso.id})\n`)

const { data: capitulos } = await admin
  .from('capitulos')
  .select('id, numero, nombre')
  .eq('curso_id', curso.id)
  .order('numero')

console.log(`Encontrados ${capitulos?.length || 0} capítulos\n`)

let updated = 0
for (const c of capitulos || []) {
  const newName = OFFICIAL_NAMES[c.numero]
  if (!newName) {
    console.log(`  - Cap ${c.numero}: sin nuevo nombre en la lista, skip`)
    continue
  }
  if (c.nombre === newName) {
    console.log(`  ∘ Cap ${c.numero}: "${c.nombre}" (ya correcto)`)
    continue
  }
  const { error } = await admin
    .from('capitulos')
    .update({ nombre: newName })
    .eq('id', c.id)
  if (error) {
    console.log(`  ✗ Cap ${c.numero}: ${error.message}`)
  } else {
    console.log(`  ✓ Cap ${c.numero}: "${c.nombre}" → "${newName}"`)
    updated++
  }
}

console.log(`\n${updated} capítulos renombrados.`)
