#!/usr/bin/env node
/**
 * Sube los audios del curso "Negocios y Finanzas para Contratistas" a
 * Supabase Storage y los registra en la tabla contenido.
 *
 * Convenciones de nombre de archivo que reconoce:
 *   cap-NN-full.mp3          → audio completo del capítulo NN
 *   cap-NN-mod-MM.mp3        → módulo MM del capítulo NN
 *   supp-aia-mod-X-NN.mp3    → suplementario AIA (cap "Material AIA")
 *   supp-aia-mod-final-y.mp3 → AIA módulo final
 *   supp-circular-e-mod-s-NN.mp3 → Circular E (cap "Material Circular E")
 *   🎧 Circular E completo .mp3 → Circular E completo
 *
 * Ignora archivos "download (N)" (nombre no parseable) y los lista al final
 * para que el user los revise manualmente.
 *
 * Uso:
 *   node scripts/seed-audios.mjs              # sube todo
 *   node scripts/seed-audios.mjs --dry        # sólo imprime qué haría
 *   node scripts/seed-audios.mjs --folder <path>   # fuente alternativa
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Load env ──────────────────────────────────────────────────────────
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

// ── Config ────────────────────────────────────────────────────────────
const CURSO_SLUG = 'negocios-y-finanzas'
const CURSO_NOMBRE = 'Negocios y Finanzas para Contratistas'
const BUCKET = 'contenido-cursos'

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const FOLDER_FLAG = args.indexOf('--folder')
const SOURCE_FOLDER =
  FOLDER_FLAG !== -1 && args[FOLDER_FLAG + 1]
    ? args[FOLDER_FLAG + 1]
    : 'C:\\Users\\valen\\AppData\\Local\\Temp'

// Nombres de capítulos — si no existen se crean con estos defaults
const CAPITULO_DEFAULTS = {
  1: 'Introducción al Negocio de Contratistas',
  2: 'Regulaciones y Licencias de Florida',
  3: 'Contabilidad y Finanzas Básicas',
  4: 'Seguros y Fianzas',
  5: 'Contratos y Obligaciones Legales',
  6: 'Gestión de Proyectos',
  7: 'Impuestos y Retenciones',
  8: 'Seguridad Laboral (OSHA)',
  9: 'Relaciones Laborales y RRHH',
  10: 'Estrategia y Crecimiento del Negocio',
  11: 'Material Suplementario: AIA',
  12: 'Material Suplementario: Circular E',
}

// ── Helpers ───────────────────────────────────────────────────────────
function log(...args) {
  console.log(...args)
}

/**
 * Parsea el nombre de archivo y devuelve { capitulo, titulo, orden } o null
 * si no se reconoce el patrón.
 */
function parseFilename(filename) {
  // Normalizar — trim, saca emojis de inicio, colapsa espacios
  const normalized = filename
    .replace(/^🎧\s*/u, '')
    .trim()
    .toLowerCase()

  // cap-NN-full.mp3
  let m = normalized.match(/^cap-(\d{1,2})-full\.mp3$/)
  if (m) {
    const n = parseInt(m[1], 10)
    return { capitulo: n, titulo: `Capítulo ${n} — Completo`, orden: 0 }
  }

  // cap-NN-mod-MM.mp3
  m = normalized.match(/^cap-(\d{1,2})-mod-(\d{1,2})\.mp3$/)
  if (m) {
    const n = parseInt(m[1], 10)
    const mod = parseInt(m[2], 10)
    return { capitulo: n, titulo: `Módulo ${mod}`, orden: 10 + mod }
  }

  // supp-aia-mod-X-NN.mp3 (variante: espacios antes del ext por bug del nombre)
  m = normalized.match(/^supp-aia-mod-([a-z])\s*-\s*(\d{1,2})\.mp3$/)
  if (m) {
    const letra = m[1].toUpperCase()
    const num = parseInt(m[2], 10)
    return {
      capitulo: 11,
      titulo: `AIA — Módulo ${letra}, parte ${num}`,
      orden: letra.charCodeAt(0) * 100 + num,
    }
  }

  // supp-aia-mod-final-y.mp3
  m = normalized.match(/^supp-aia-mod-final-y\.mp3$/)
  if (m) {
    return {
      capitulo: 11,
      titulo: 'AIA — Módulo Final',
      orden: 9999,
    }
  }

  // supp-circular-e-mod-s-NN.mp3
  m = normalized.match(/^supp-circular-e-mod-s-(\d{1,2})\.mp3$/)
  if (m) {
    const num = parseInt(m[1], 10)
    return {
      capitulo: 12,
      titulo: `Circular E — Sección ${num}`,
      orden: num,
    }
  }

  // Circular E completo (emoji-prefijado ya lo sacamos)
  m = normalized.match(/^circular\s+e\s+completo\s*\.mp3$/)
  if (m) {
    return { capitulo: 12, titulo: 'Circular E — Completo', orden: 0 }
  }

  return null
}

/**
 * Upsert del curso.
 */
async function upsertCurso() {
  const { data: existing } = await admin
    .from('cursos')
    .select('id, nombre')
    .eq('slug', CURSO_SLUG)
    .maybeSingle()

  if (existing) {
    log(`✓ Curso existente: ${existing.nombre} (${existing.id})`)
    return existing.id
  }

  const { data, error } = await admin
    .from('cursos')
    .insert({
      nombre: CURSO_NOMBRE,
      slug: CURSO_SLUG,
      descripcion:
        'Guía completa de negocios, finanzas y regulaciones para obtener tu licencia de contratista eléctrico en Florida.',
      orden: 0,
      activo: true,
    })
    .select('id')
    .single()

  if (error) throw new Error(`No pude crear curso: ${error.message}`)
  log(`✓ Curso creado: ${CURSO_NOMBRE} (${data.id})`)
  return data.id
}

/**
 * Garantiza que los capítulos 1-12 existen. Devuelve Map<numero, id>.
 */
async function ensureCapitulos(cursoId, neededNumbers) {
  const { data: existing } = await admin
    .from('capitulos')
    .select('id, numero, nombre')
    .eq('curso_id', cursoId)

  const map = new Map()
  for (const c of existing || []) map.set(c.numero, c.id)

  const toCreate = []
  for (const n of neededNumbers) {
    if (!map.has(n)) {
      toCreate.push({
        curso_id: cursoId,
        numero: n,
        nombre: CAPITULO_DEFAULTS[n] || `Capítulo ${n}`,
        descripcion: null,
      })
    }
  }

  if (toCreate.length && !DRY) {
    const { data: created, error } = await admin
      .from('capitulos')
      .insert(toCreate)
      .select('id, numero, nombre')
    if (error) throw new Error(`Error creando capítulos: ${error.message}`)
    for (const c of created) {
      map.set(c.numero, c.id)
      log(`  + Capítulo ${c.numero}: ${c.nombre}`)
    }
  } else if (toCreate.length) {
    for (const c of toCreate) log(`  [dry] crearía Cap. ${c.numero}: ${c.nombre}`)
  }

  return map
}

/**
 * Sube un archivo al bucket y crea/actualiza la fila de contenido.
 * Idempotente por filename (usa upsert en storage y busca por titulo+capitulo).
 */
async function seedOne(file, capMap) {
  const parsed = parseFilename(file.name)
  if (!parsed) return { status: 'skipped', reason: 'nombre no parseable', file: file.name }

  const capituloId = capMap.get(parsed.capitulo)
  if (!capituloId)
    return {
      status: 'error',
      reason: `no hay capítulo ${parsed.capitulo}`,
      file: file.name,
    }

  // Check si ya existe en contenido
  const { data: existing } = await admin
    .from('contenido')
    .select('id, archivo_url')
    .eq('capitulo_id', capituloId)
    .eq('tipo', 'audio')
    .eq('titulo', parsed.titulo)
    .maybeSingle()

  if (existing) {
    return { status: 'already', file: file.name, titulo: parsed.titulo }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${CURSO_SLUG}/capitulo-${String(parsed.capitulo).padStart(2, '0')}/${safeName}`

  if (DRY) {
    return {
      status: 'dry',
      file: file.name,
      titulo: parsed.titulo,
      path,
      capitulo: parsed.capitulo,
    }
  }

  // Upload a Storage (upsert por si la corrida anterior subió pero falló el insert)
  const buffer = readFileSync(file.fullPath)
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (upErr)
    return {
      status: 'error',
      reason: `upload: ${upErr.message}`,
      file: file.name,
    }

  // Insert contenido
  const { error: insErr } = await admin.from('contenido').insert({
    capitulo_id: capituloId,
    tipo: 'audio',
    titulo: parsed.titulo,
    archivo_url: path,
    orden: parsed.orden,
  })

  if (insErr)
    return {
      status: 'error',
      reason: `insert: ${insErr.message}`,
      file: file.name,
    }

  return {
    status: 'uploaded',
    file: file.name,
    titulo: parsed.titulo,
    capitulo: parsed.capitulo,
  }
}

/**
 * Pool de workers concurrentes (simple, sin dep extra).
 */
async function runPool(items, worker, concurrency = 4) {
  const results = []
  let idx = 0
  async function run() {
    while (idx < items.length) {
      const i = idx++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => run()))
  return results
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  log(`\n▸ Fuente: ${SOURCE_FOLDER}`)
  log(`▸ Bucket: ${BUCKET}`)
  log(`▸ Modo: ${DRY ? 'DRY-RUN (sin cambios)' : 'LIVE'}\n`)

  // Lista .mp3 del folder
  const files = readdirSync(SOURCE_FOLDER)
    .filter((f) => f.toLowerCase().endsWith('.mp3'))
    .map((name) => {
      const fullPath = join(SOURCE_FOLDER, name)
      try {
        const s = statSync(fullPath)
        return { name, fullPath, size: s.size }
      } catch {
        return null
      }
    })
    .filter(Boolean)

  log(`▸ Archivos .mp3 detectados: ${files.length}`)

  // Clasifica por patrón para saber qué capítulos se necesitan
  const parsed = files.map((f) => ({ ...f, parsed: parseFilename(f.name) }))
  const unrecognized = parsed.filter((p) => !p.parsed)
  const recognized = parsed.filter((p) => p.parsed)
  const neededCaps = Array.from(
    new Set(recognized.map((p) => p.parsed.capitulo))
  ).sort((a, b) => a - b)

  log(`▸ Reconocidos: ${recognized.length}`)
  log(`▸ Sin patrón (se ignoran): ${unrecognized.length}`)
  log(`▸ Capítulos necesarios: ${neededCaps.join(', ')}\n`)

  // Upsert curso + capítulos
  const cursoId = await upsertCurso()
  const capMap = await ensureCapitulos(cursoId, neededCaps)

  log(`\n▸ Subiendo archivos (${recognized.length})...\n`)

  let uploaded = 0
  let already = 0
  let errored = 0
  const errors = []

  const results = await runPool(
    recognized,
    async (file, i) => {
      const r = await seedOne(file, capMap)
      const prefix = `[${(i + 1).toString().padStart(3)}/${recognized.length}]`
      if (r.status === 'uploaded') {
        uploaded++
        log(`${prefix} ✓ ${r.file} → cap. ${r.capitulo} / "${r.titulo}"`)
      } else if (r.status === 'already') {
        already++
        log(`${prefix} ∘ ${r.file} (ya existía — skip)`)
      } else if (r.status === 'dry') {
        log(`${prefix} [dry] ${r.file} → ${r.path}`)
      } else if (r.status === 'error') {
        errored++
        errors.push(r)
        log(`${prefix} ✗ ${r.file}: ${r.reason}`)
      }
      return r
    },
    4
  )

  log('\n─────────────────────────────────')
  log(`Subidos:       ${uploaded}`)
  log(`Ya existían:   ${already}`)
  log(`Con error:     ${errored}`)
  log(`Sin reconocer: ${unrecognized.length}`)
  log('─────────────────────────────────')

  if (unrecognized.length) {
    log('\nArchivos sin patrón reconocido:')
    for (const u of unrecognized.slice(0, 30)) {
      log(`  - ${u.name} (${(u.size / 1024 / 1024).toFixed(1)} MB)`)
    }
    if (unrecognized.length > 30)
      log(`  ... y ${unrecognized.length - 30} más`)
  }

  if (errored) {
    log('\nErrores:')
    for (const e of errors) log(`  - ${e.file}: ${e.reason}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
