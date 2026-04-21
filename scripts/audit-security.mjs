#!/usr/bin/env node
/**
 * Security audit for the Supabase instance.
 *
 * - Uses the ANON key to simulate an unauthenticated attacker.
 * - Uses the SERVICE_ROLE key as ground truth (what actually exists).
 * - Any table where ANON can see data that it shouldn't is a hole.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const envRaw = readFileSync(envPath, 'utf-8')
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
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !ANON || !SERVICE) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const anon = createClient(URL, ANON)
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })

const results = []
const crit = (msg) => results.push({ level: '❌ CRITICO', msg })
const warn = (msg) => results.push({ level: '⚠️  REVISAR', msg })
const ok = (msg) => results.push({ level: '✅ OK', msg })

console.log('\n═════════════════════════════════════════════════════════════')
console.log(`🔐 Security Audit — ${URL}`)
console.log('═════════════════════════════════════════════════════════════\n')

// ─── 1. Tablas existentes + RLS real (test con anon) ──────────
// Para cada tabla, anon debería ver 0 filas (o solo las permitidas).
// Si anon ve filas privadas, RLS está roto.

const tablas = {
  profiles: { private: true, label: 'profiles (datos personales de usuarios)' },
  cursos: { private: false, label: 'cursos (público para usuarios con suscripción)' },
  capitulos: { private: false, label: 'capitulos (público para usuarios con suscripción)' },
  contenido: { private: true, label: 'contenido (solo usuarios pagos)' },
  progreso_estudio: { private: true, label: 'progreso_estudio (por usuario)' },
  preguntas: { private: true, label: 'preguntas (solo usuarios pagos)' },
  sesiones_examen: { private: true, label: 'sesiones_examen (por usuario)' },
  respuestas_usuario: { private: true, label: 'respuestas_usuario (por usuario)' },
  posts_comunidad: { private: true, label: 'posts_comunidad (solo suscriptores)' },
  comentarios: { private: true, label: 'comentarios (solo suscriptores)' },
  pagos: { private: true, label: 'pagos (datos financieros)' },
  conversaciones_ai: { private: true, label: 'conversaciones_ai (por usuario)' },
  mensajes_ai: { private: true, label: 'mensajes_ai (por usuario)' },
}

console.log('📊 1. Comparando acceso ANON vs SERVICE_ROLE para cada tabla...\n')

for (const [tabla, meta] of Object.entries(tablas)) {
  // Ground truth: cuántas filas hay en realidad
  const { count: realCount, error: adminErr } = await admin
    .from(tabla)
    .select('*', { count: 'exact', head: true })

  if (adminErr) {
    crit(`Tabla ${tabla} NO existe o admin no puede accederla — ${adminErr.message}`)
    console.log(`  ${tabla.padEnd(22)}  ❌ ${adminErr.message}`)
    continue
  }

  // Ataque: qué ve un usuario sin loguearse
  const { count: anonCount, error: anonErr } = await anon
    .from(tabla)
    .select('*', { count: 'exact', head: true })

  const realTxt = realCount ?? 0
  const anonTxt = anonErr ? `bloqueado (${anonErr.code || 'error'})` : `${anonCount ?? 0}`

  // Evaluación
  if (meta.private) {
    // Tablas privadas: anon NO debería ver NADA (excepto 0 si no hay filas)
    if (anonErr) {
      ok(`${tabla}: anon bloqueado por RLS ✓`)
      console.log(`  ${tabla.padEnd(22)}  ✅ real=${realTxt}, anon=bloqueado`)
    } else if ((anonCount ?? 0) === 0) {
      ok(`${tabla}: anon no ve filas ✓`)
      console.log(`  ${tabla.padEnd(22)}  ✅ real=${realTxt}, anon=0 (RLS ok)`)
    } else {
      crit(`${tabla}: anon ve ${anonCount} de ${realCount} filas — RLS FILTRANDO MAL`)
      console.log(`  ${tabla.padEnd(22)}  ❌ real=${realTxt}, anon=${anonTxt} — HUECO`)
    }
  } else {
    // Tablas semi-públicas: anon puede ver (cursos/capítulos son metadatos)
    console.log(`  ${tabla.padEnd(22)}  ℹ️  real=${realTxt}, anon=${anonTxt} (público ok)`)
  }
}

// ─── 2. Storage buckets ────────────────────────────────────────

console.log('\n📦 2. Storage buckets — visibilidad y límites...\n')

const { data: buckets, error: bErr } = await admin.storage.listBuckets()

if (bErr) {
  crit(`No se pudieron listar buckets: ${bErr.message}`)
} else if (!buckets || buckets.length === 0) {
  warn('No hay buckets creados — sin storage configurado')
  console.log('  (ningún bucket)')
} else {
  for (const b of buckets) {
    const visibility = b.public ? '⚠️  PÚBLICO' : '✅ PRIVADO'
    const size = b.file_size_limit ? `${(b.file_size_limit / 1024 / 1024).toFixed(0)} MB` : 'sin límite'
    const mime = b.allowed_mime_types?.length
      ? `${b.allowed_mime_types.length} tipo(s)`
      : '⚠️  sin restricción'
    console.log(`  ${b.id.padEnd(25)}  ${visibility}  size=${size}  mime=${mime}`)

    if (b.public && ['contenido-pdfs', 'contenido-audios', 'contenido-videos', 'libros'].includes(b.id)) {
      crit(`Bucket "${b.id}" es PÚBLICO pero debería ser privado (contenido pago)`)
    }
    if (!b.file_size_limit) {
      warn(`Bucket "${b.id}" sin límite de tamaño — riesgo de abuso`)
    }
    if (!b.allowed_mime_types?.length) {
      warn(`Bucket "${b.id}" sin MIME restringido — puede subir cualquier cosa`)
    }
  }
}

// ─── 3. auth.users — confirmaciones ───────────────────────────

console.log('\n👥 3. Auth users — confirmaciones y estado...\n')

const { data: usersData, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 })

if (uErr) {
  crit(`No se pudo listar usuarios: ${uErr.message}`)
} else {
  const users = usersData?.users || []
  const total = users.length
  const confirmed = users.filter((u) => u.email_confirmed_at).length
  const unconfirmed = total - confirmed
  const banned = users.filter((u) => u.banned_until).length

  console.log(`  Total usuarios:   ${total}`)
  console.log(`  Confirmados:      ${confirmed}`)
  console.log(`  Sin confirmar:    ${unconfirmed}`)
  console.log(`  Baneados:         ${banned}`)

  if (unconfirmed > 0 && total > 3) {
    warn(`${unconfirmed} usuarios sin confirmar email — revisar si "Confirm email" está ON en Auth`)
  } else {
    ok('Estado de confirmaciones OK')
  }
}

// ─── 4. Profiles — roles y subscription_status ────────────────

console.log('\n👤 4. Profiles — distribución de roles y suscripciones...\n')

const { data: profiles, error: pErr } = await admin
  .from('profiles')
  .select('rol, subscription_status, subscription_plan')

if (pErr) {
  crit(`No se pudo leer profiles: ${pErr.message}`)
} else {
  const roles = {}
  const subs = {}
  for (const p of profiles || []) {
    roles[p.rol || '(null)'] = (roles[p.rol || '(null)'] || 0) + 1
    const key = `${p.subscription_status || '(null)'}${p.subscription_plan ? `/${p.subscription_plan}` : ''}`
    subs[key] = (subs[key] || 0) + 1
  }

  console.log('  Roles:')
  for (const [r, n] of Object.entries(roles)) {
    const marker =
      ['estudiante', 'admin', 'root'].includes(r) ? '✅' : r === '(null)' ? '⚠️ ' : '❌'
    console.log(`    ${marker}  ${r.padEnd(15)} ${n}`)
    if (!['estudiante', 'admin', 'root', '(null)'].includes(r)) {
      crit(`Rol inválido "${r}" en ${n} usuario(s)`)
    }
    if (r === '(null)') {
      warn(`${n} usuarios con rol null`)
    }
  }

  console.log('  Suscripciones:')
  for (const [s, n] of Object.entries(subs)) {
    console.log(`    ${s.padEnd(30)} ${n}`)
  }
}

// ─── 5. Verificar que service_role NO esté en cliente ─────────

console.log('\n🔑 5. Verificando env vars en cliente...\n')

const clientExposed = []
if (env.NEXT_PUBLIC_SUPABASE_URL) clientExposed.push('NEXT_PUBLIC_SUPABASE_URL (ok)')
if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) clientExposed.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (ok)')

// Lo crítico: que service_role NO tenga prefijo NEXT_PUBLIC_
const serviceExposed = Object.keys(env).some(
  (k) => k.startsWith('NEXT_PUBLIC_') && k.toLowerCase().includes('service')
)
if (serviceExposed) {
  crit('SERVICE_ROLE_KEY tiene prefijo NEXT_PUBLIC_ — expuesto al cliente')
} else {
  ok('SERVICE_ROLE_KEY solo en servidor')
  console.log('  ✅ service_role NO expuesto al cliente')
}

// ─── Resumen final ────────────────────────────────────────────

console.log('\n═════════════════════════════════════════════════════════════')
console.log('🎯 RESUMEN')
console.log('═════════════════════════════════════════════════════════════\n')

const criticos = results.filter((r) => r.level.includes('CRITICO'))
const warnings = results.filter((r) => r.level.includes('REVISAR'))
const oks = results.filter((r) => r.level.includes('OK'))

console.log(`✅ OK:       ${oks.length}`)
console.log(`⚠️  REVISAR:  ${warnings.length}`)
console.log(`❌ CRITICO:  ${criticos.length}`)

if (criticos.length > 0) {
  console.log('\n❌ ISSUES CRÍTICOS:')
  for (const r of criticos) console.log(`   - ${r.msg}`)
}
if (warnings.length > 0) {
  console.log('\n⚠️  PARA REVISAR:')
  for (const r of warnings) console.log(`   - ${r.msg}`)
}

console.log('\n📌 Lo que este script NO puede verificar desde aquí:')
console.log('   - RLS policy definitions (pg_policies) → correr audit-security.sql en SQL Editor')
console.log('   - Auth settings (Confirm email, Site URL, Redirect URLs) → revisar en Auth → URL Configuration')
console.log('   - Backups y Point-in-time recovery → Database → Backups')
console.log('   - Storage policies detalladas → Storage → Policies\n')

process.exit(criticos.length > 0 ? 1 : 0)
