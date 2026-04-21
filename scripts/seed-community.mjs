#!/usr/bin/env node
/**
 * Community seed — crea 8 dudas FAQ iniciales con respuestas de Andry
 * (o el root user). Con esto el espacio deja de sentirse "vacío" desde
 * el primer día.
 *
 * Uso:
 *   node scripts/seed-community.mjs          # crea los posts
 *   node scripts/seed-community.mjs --clean  # borra los seeded y recrea
 *
 * Los posts se marcan con un prefijo "[FAQ]" en el título para poder
 * identificarlos y limpiarlos después.
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

const TAG = '[FAQ]'

const FAQ_POSTS = [
  {
    titulo: `${TAG} ¿Cuáles son los requisitos para aplicar al examen en Florida?`,
    contenido:
      'Buenas, recién empiezo. ¿Alguien me puede decir qué necesito para aplicar al examen de contratista en Florida? Escuché que hay que tener años de experiencia y huellas digitales pero no estoy 100% seguro.',
    respuestas: [
      'Sí, los requisitos básicos son: 4 años de experiencia como contratista o título universitario en construcción, huellas digitales (fingerprints) con background check, seguro de Workers Compensation, y una fianza (bond) de al menos $20,000. También tenés que tener al menos 18 años.',
      'Yo agregaría que las huellas las tenés que hacer con Pearson Vue o un proveedor certificado. Y el examen es en dos partes: Negocios y Finanzas + el específico de tu oficio (Building, Electrical, etc).',
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} ¿Dónde y cómo se rinde el examen?`,
    contenido:
      '¿Alguien que ya lo rindió me puede contar cómo es el proceso? ¿Es en computadora? ¿Se puede usar calculadora? ¿Cuánto dura?',
    respuestas: [
      'Es en computadora en centros Pearson Vue. Dura 6h 30min entre las dos partes. Podés usar calculadora financiera (HP 10bII+ es la más común) y los libros oficiales (open book). Tenés que agendar online y pagar aparte cada parte.',
      'Agregando: llevá DNI + pasaporte, llegá 30min antes. Te dan una hoja y lápiz para cálculos. Entre las dos partes hay un descanso de 10 minutos. Si aprobás una parte y la otra no, podés re-rendir solo la que faltó.',
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} ¿Qué es la Lien Law y por qué me la preguntan tanto?`,
    contenido:
      'En todas las preguntas de práctica aparece la Lien Law. ¿Alguien me la puede explicar fácil? No termino de entender qué tiene que ver con ser contratista.',
    respuestas: [
      'La Lien Law (Chapter 713 de FL Statutes) protege a contratistas, subcontratistas y proveedores cuando un cliente no les paga. Te da derecho a poner un "gravamen" sobre la propiedad. Es clave porque si no cobrás, es tu única protección legal para recuperar la plata.',
      'Lo que siempre me preguntan: Notice to Owner (NTO) tiene que mandarse dentro de los 45 días desde que empezaste a trabajar. El lien en sí tenés 90 días para registrarlo desde que terminaste. Si pasás esos plazos, perdés el derecho.',
    ],
  },
  {
    titulo: `${TAG} Seguros obligatorios: ¿cuáles necesito sí o sí?`,
    contenido:
      'Estoy por abrir mi compañía y el broker me ofrece varios seguros. ¿Cuáles son obligatorios por ley en FL y cuáles son opcionales pero recomendados?',
    respuestas: [
      'Obligatorios: General Liability mínimo $300K y Workers Comp si tenés empleados (aunque sea 1). Si sos solo vos como contractor sin empleados, podés hacer una exemption pero sólo vale 2 años.',
      'Opcionales pero RECOMENDADOS: Commercial Auto (si usás camioneta de trabajo), Tools & Equipment (te cubre robo de herramientas), Inland Marine (para material en tránsito), y Errors & Omissions (por si te demandan por un error de diseño).',
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} ¿Es obligatorio tener LLC o puedo trabajar como Sole Proprietor?`,
    contenido:
      'Me dicen que empiece con LLC pero otros me dicen Sole Proprietor para empezar. ¿Cuál conviene realmente?',
    respuestas: [
      'Sole Proprietor es más fácil y barato de arrancar, pero TU PATRIMONIO PERSONAL queda expuesto si te demandan. Un cliente se resbala y puede ir contra tu casa, tu auto.',
      'LLC te protege ese patrimonio (asset protection) y además te permite pagar menos impuestos si facturás bien. Cuesta ~$125 el registro en FL + $138.75 anual. Vale la pena pagarlo desde el día 1.',
    ],
  },
  {
    titulo: `${TAG} ¿Qué es el Workers Compensation y cuánto cuesta?`,
    contenido:
      'Workers Comp me sale como $3,500 al año para una construcción chica. ¿Es normal ese precio?',
    respuestas: [
      'Sí, puede variar de $2,500 a $8,000 dependiendo de: payroll total, cantidad de empleados, tipo de construcción (residencial es más barato que comercial), y experiencia previa de claims.',
      'Un tip: si estás empezando sin empleados, podés pedir una EXEMPTION en el estado por 2 años — es gratis y evitás pagar el seguro. Pero si contratás a UNO solo, ya tenés que tener el seguro activo.',
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} Nunca hice contabilidad, ¿qué software me recomiendan?`,
    contenido:
      'Me estoy volviendo loco con facturas en papel y excel. ¿Qué usan ustedes para manejar la contabilidad del negocio?',
    respuestas: [
      'QuickBooks Online es el estándar para contratistas en FL. ~$30/mes el plan básico. Te permite facturar, trackear gastos, hacer la nómina y sacar reportes para el contador.',
      'Yo uso Xero que me sale un poco más barato y tiene mejor app mobile. Lo importante es separar cuenta bancaria personal de la del negocio — eso te salva de dolores de cabeza con el IRS.',
    ],
  },
  {
    titulo: `${TAG} ¿Cómo se calcula el overhead en un presupuesto?`,
    contenido:
      'El examen tiene muchas preguntas de cálculo de overhead y sigo mezclando conceptos. ¿Alguien tiene un ejemplo práctico?',
    respuestas: [
      'Overhead es todo gasto que NO es directamente del trabajo: alquiler oficina, seguros, teléfono, sueldo tuyo como dueño, marketing, combustible, etc.\n\nFórmula simple:\nOverhead anual total / Ingresos anuales totales = % Overhead\n\nEjemplo: si gastás $50K de overhead y facturás $500K → tu overhead es 10%. En cada presupuesto agregás 10% sobre el costo directo para cubrirlo, y ARRIBA de eso la ganancia.',
      'Buen ejemplo. Yo agregaría que el examen distingue entre overhead general y overhead específico del proyecto — hay que leer bien la pregunta. Y la ganancia (profit) siempre va DESPUÉS del overhead, nunca mezclados.',
    ],
    resuelto: true,
  },
]

async function getRootUser() {
  const { data, error } = await admin
    .from('profiles')
    .select('id, nombre_completo')
    .eq('rol', 'root')
    .maybeSingle()

  if (error || !data) {
    throw new Error(
      'No se encontró usuario root. Creá al menos 1 usuario admin primero.'
    )
  }
  return data
}

async function cleanupExistingSeeds() {
  const { data: posts } = await admin
    .from('posts_comunidad')
    .select('id')
    .like('titulo', `${TAG}%`)

  if (!posts?.length) return 0

  const ids = posts.map((p) => p.id)
  // Comments cascade via FK
  await admin.from('posts_comunidad').delete().in('id', ids)
  return ids.length
}

async function main() {
  const clean = process.argv.includes('--clean')

  if (clean) {
    console.log('\n🧹 Limpiando seeds previos...')
    const removed = await cleanupExistingSeeds()
    console.log(`   Eliminados ${removed} posts previos.\n`)
  }

  const root = await getRootUser()
  console.log(`👤 Usando usuario: ${root.nombre_completo}`)

  let created = 0
  let comments = 0

  for (const post of FAQ_POSTS) {
    // Check if already exists (skip if not clean mode)
    if (!clean) {
      const { data: existing } = await admin
        .from('posts_comunidad')
        .select('id')
        .eq('titulo', post.titulo)
        .maybeSingle()
      if (existing) {
        console.log(`  ⏭  Ya existe: ${post.titulo.slice(0, 60)}...`)
        continue
      }
    }

    const { data: newPost, error: postErr } = await admin
      .from('posts_comunidad')
      .insert({
        user_id: root.id,
        tipo: 'duda',
        titulo: post.titulo,
        contenido: post.contenido,
        resuelto: post.resuelto || false,
      })
      .select('id')
      .single()

    if (postErr || !newPost) {
      console.error(`  ❌ Error creando "${post.titulo}": ${postErr?.message}`)
      continue
    }

    created++
    console.log(`  ✅ ${post.titulo.slice(0, 60)}...`)

    // Add comments
    if (post.respuestas?.length) {
      for (const respuesta of post.respuestas) {
        const { error: cErr } = await admin.from('comentarios').insert({
          post_id: newPost.id,
          user_id: root.id,
          contenido: respuesta,
        })
        if (!cErr) comments++
      }
    }
  }

  console.log(`\n🎉 Listo: ${created} posts + ${comments} comentarios creados.`)
  console.log(`   Todos con tag "${TAG}" para identificarlos.`)
  console.log(`   Re-corré con --clean para borrarlos y recrear.\n`)
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
