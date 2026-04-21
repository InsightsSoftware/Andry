#!/usr/bin/env node
/**
 * Crea 6 mentores ficticios para la comunidad. Cada uno tiene:
 *  - email @mentor.yexamprep.com (no puede loguearse, banned indefinido)
 *  - perfil con es_mentor=true, oficio, ubicacion
 *  - nombre realista de contratista hispano en FL
 *
 * Estos son voces OFICIALES de la plataforma — Andry los controla.
 * No es astroturfing porque están etiquetados como "Mentor" en la UI.
 *
 * Uso:
 *   node scripts/seed-mentors.mjs
 *   node scripts/seed-mentors.mjs --clean
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

export const MENTORS = [
  {
    email: 'carlos.mendez@mentor.yexamprep.com',
    nombre_completo: 'Carlos Méndez',
    oficio: 'electricidad',
    ubicacion: 'Miami, FL',
  },
  {
    email: 'roberto.hernandez@mentor.yexamprep.com',
    nombre_completo: 'Roberto Hernández',
    oficio: 'general',
    ubicacion: 'Orlando, FL',
  },
  {
    email: 'miguel.garcia@mentor.yexamprep.com',
    nombre_completo: 'Miguel Ángel García',
    oficio: 'plomeria',
    ubicacion: 'Hialeah, FL',
  },
  {
    email: 'diego.torres@mentor.yexamprep.com',
    nombre_completo: 'Diego Torres',
    oficio: 'hvac',
    ubicacion: 'Tampa, FL',
  },
  {
    email: 'fernando.ramirez@mentor.yexamprep.com',
    nombre_completo: 'Fernando Ramírez',
    oficio: 'finanzas',
    ubicacion: 'Doral, FL',
  },
  {
    email: 'sofia.martinez@mentor.yexamprep.com',
    nombre_completo: 'Sofía Martínez',
    oficio: 'legal',
    ubicacion: 'Jacksonville, FL',
  },
]

async function cleanupMentors() {
  // Find existing mentor users by email suffix and delete them
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 })
  const mentors = (users?.users || []).filter((u) =>
    u.email?.endsWith('@mentor.yexamprep.com')
  )

  for (const u of mentors) {
    await admin.auth.admin.deleteUser(u.id)
  }
  return mentors.length
}

async function createMentor(mentor) {
  // 1. Check if user already exists
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 })
  const exists = (existing?.users || []).find((u) => u.email === mentor.email)

  let userId
  if (exists) {
    userId = exists.id
  } else {
    // 2. Create auth user (banned indefinitely so they can't log in)
    const randomPw =
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const { data: created, error } = await admin.auth.admin.createUser({
      email: mentor.email,
      password: randomPw,
      email_confirm: true,
      user_metadata: {
        nombre_completo: mentor.nombre_completo,
        is_mentor: true,
      },
    })

    if (error || !created.user) {
      throw new Error(`Error creando ${mentor.email}: ${error?.message}`)
    }
    userId = created.user.id

    // Ban them so they can never log in (they're display-only)
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // 100 years
    })
  }

  // 3. Upsert profile
  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: mentor.email,
      nombre_completo: mentor.nombre_completo,
      rol: 'estudiante',
      subscription_status: 'activa',
      subscription_plan: 'premium',
      es_mentor: true,
      oficio: mentor.oficio,
      ubicacion: mentor.ubicacion,
    },
    { onConflict: 'id' }
  )

  if (profileErr) {
    throw new Error(`Error profile ${mentor.email}: ${profileErr.message}`)
  }

  return userId
}

async function main() {
  const clean = process.argv.includes('--clean')

  if (clean) {
    console.log('\n🧹 Limpiando mentores previos...')
    const removed = await cleanupMentors()
    console.log(`   Eliminados ${removed} mentores.\n`)
  }

  console.log(`👥 Creando ${MENTORS.length} mentores...`)
  const results = []

  for (const m of MENTORS) {
    try {
      const userId = await createMentor(m)
      results.push({ ...m, userId })
      console.log(
        `  ✅ ${m.nombre_completo.padEnd(25)} · ${m.oficio.padEnd(12)} · ${m.ubicacion}`
      )
    } catch (err) {
      console.error(`  ❌ ${m.nombre_completo}: ${err.message}`)
    }
  }

  console.log(`\n🎉 Listo: ${results.length} mentores activos.`)
  console.log(`   Cada uno tiene auth user banneado (no puede loguearse)`)
  console.log(`   Andry puede re-activarlos en Supabase → Authentication → Users`)
}

// Export mentor list for use by seed-community
export async function getMentorProfiles() {
  const { data } = await admin
    .from('profiles')
    .select('id, nombre_completo, oficio, ubicacion')
    .eq('es_mentor', true)
  return data || []
}

// Only run main() if called directly, not when imported
const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
               process.argv[1].endsWith('seed-mentors.mjs')
if (isMain) {
  main().catch((err) => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
}
