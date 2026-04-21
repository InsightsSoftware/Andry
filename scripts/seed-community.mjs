#!/usr/bin/env node
/**
 * Community seed — crea posts con diversidad de autores (mentores + root)
 * y comentarios cruzados entre mentores.
 *
 * Requisitos:
 *   - Migration 00014 aplicada (es_mentor column)
 *   - scripts/seed-mentors.mjs ya corrido (6 mentores creados)
 *
 * Uso:
 *   node scripts/seed-community.mjs          # crea
 *   node scripts/seed-community.mjs --clean  # borra [FAQ] y recrea
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

// Map mentor oficio → mentor id (populated at runtime)
const byOficio = {}

// Each post can specify authorOficio to pick the right mentor, or
// "student" for a random non-mentor (fallback to root).
const FAQ_POSTS = [
  {
    titulo: `${TAG} ¿Cuáles son los requisitos para aplicar al examen en Florida?`,
    author: 'student',
    contenido:
      'Buenas, recién empiezo. ¿Alguien me puede decir qué necesito para aplicar al examen de contratista en Florida? Escuché que hay que tener años de experiencia y huellas digitales pero no estoy 100% seguro.',
    comments: [
      {
        oficio: 'general',
        contenido:
          'Los requisitos básicos son: 4 años de experiencia como contratista o título universitario en construcción, huellas digitales con background check, seguro de Workers Compensation, y una fianza de al menos $20,000. También tenés que tener al menos 18 años.',
      },
      {
        oficio: 'legal',
        contenido:
          'Agrego: las huellas se hacen con Pearson Vue o un proveedor certificado. El examen es en dos partes: Negocios y Finanzas + el específico de tu oficio (Building, Electrical, etc). El DBPR (Department of Business and Professional Regulation) es quien maneja todo.',
      },
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} ¿Dónde y cómo se rinde el examen?`,
    author: 'student',
    contenido:
      '¿Alguien que ya lo rindió me puede contar cómo es el proceso? ¿Es en computadora? ¿Se puede usar calculadora? ¿Cuánto dura?',
    comments: [
      {
        oficio: 'general',
        contenido:
          'Es en computadora en centros Pearson Vue. Dura 6h 30min entre las dos partes. Podés usar calculadora financiera (HP 10bII+ es la más común) y los libros oficiales (open book). Tenés que agendar online y pagar aparte cada parte.',
      },
      {
        oficio: 'finanzas',
        contenido:
          'Agregando: llevá DNI + pasaporte, llegá 30min antes. Te dan una hoja y lápiz para cálculos. Entre las dos partes hay un descanso de 10 minutos. Si aprobás una parte y la otra no, podés re-rendir solo la que faltó.',
      },
      {
        oficio: 'electricidad',
        contenido:
          'Para la parte de Electrical yo recomiendo llevar el NFPA 70 (NEC) físico aunque también te lo dan digital — yo me siento más rápido buscando con las pestañas que uso en el libro.',
      },
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} ¿Qué es la Lien Law y por qué me la preguntan tanto?`,
    author: 'student',
    contenido:
      'En todas las preguntas de práctica aparece la Lien Law. ¿Alguien me la puede explicar fácil? No termino de entender qué tiene que ver con ser contratista.',
    comments: [
      {
        oficio: 'legal',
        contenido:
          'La Lien Law (Chapter 713 de FL Statutes) protege a contratistas, subcontratistas y proveedores cuando un cliente no les paga. Te da derecho a poner un "gravamen" sobre la propiedad. Es clave porque si no cobrás, es tu única protección legal para recuperar la plata.',
      },
      {
        oficio: 'general',
        contenido:
          'Lo que siempre me preguntan: Notice to Owner (NTO) tiene que mandarse dentro de los 45 días desde que empezaste a trabajar. El lien en sí tenés 90 días para registrarlo desde que terminaste. Si pasás esos plazos, perdés el derecho.',
      },
      {
        oficio: 'finanzas',
        contenido:
          'Un tip práctico que aprendí: siempre cobrá el primer pago del 30-40% antes de empezar. Si el cliente no paga ese anticipo, ya sabés con quién estás tratando. Ahorra muchos problemas después.',
      },
    ],
  },
  {
    titulo: `${TAG} Seguros obligatorios: ¿cuáles necesito sí o sí?`,
    author: 'student',
    contenido:
      'Estoy por abrir mi compañía y el broker me ofrece varios seguros. ¿Cuáles son obligatorios por ley en FL y cuáles son opcionales pero recomendados?',
    comments: [
      {
        oficio: 'finanzas',
        contenido:
          'Obligatorios: General Liability mínimo $300K y Workers Comp si tenés empleados (aunque sea 1). Si sos solo vos como contractor sin empleados, podés hacer una exemption pero sólo vale 2 años.',
      },
      {
        oficio: 'general',
        contenido:
          'Opcionales pero RECOMENDADOS: Commercial Auto (si usás camioneta de trabajo), Tools & Equipment (te cubre robo de herramientas), Inland Marine (para material en tránsito), y Errors & Omissions (por si te demandan por un error de diseño).',
      },
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} ¿Es obligatorio tener LLC o puedo trabajar como Sole Proprietor?`,
    author: 'student',
    contenido:
      'Me dicen que empiece con LLC pero otros me dicen Sole Proprietor para empezar. ¿Cuál conviene realmente?',
    comments: [
      {
        oficio: 'legal',
        contenido:
          'Sole Proprietor es más fácil y barato de arrancar, pero TU PATRIMONIO PERSONAL queda expuesto si te demandan. Un cliente se resbala y puede ir contra tu casa, tu auto.',
      },
      {
        oficio: 'finanzas',
        contenido:
          'LLC te protege ese patrimonio (asset protection) y además te permite pagar menos impuestos si facturás bien. Cuesta ~$125 el registro en FL + $138.75 anual. Vale la pena pagarlo desde el día 1.',
      },
      {
        oficio: 'general',
        contenido:
          'Yo abrí LLC desde el inicio y no me arrepiento. Tres años después ya estoy con S-Corp election que me ahorra más impuestos. Pero para eso ya tenés que facturar >$60K/año.',
      },
    ],
  },
  {
    titulo: `${TAG} ¿Qué es el Workers Compensation y cuánto cuesta?`,
    author: 'student',
    contenido:
      'Workers Comp me sale como $3,500 al año para una construcción chica. ¿Es normal ese precio?',
    comments: [
      {
        oficio: 'finanzas',
        contenido:
          'Sí, puede variar de $2,500 a $8,000 dependiendo de: payroll total, cantidad de empleados, tipo de construcción (residencial es más barato que comercial), y experiencia previa de claims.',
      },
      {
        oficio: 'general',
        contenido:
          'Un tip: si estás empezando sin empleados, podés pedir una EXEMPTION en el estado por 2 años — es gratis y evitás pagar el seguro. Pero si contratás a UNO solo, ya tenés que tener el seguro activo.',
      },
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} Nunca hice contabilidad, ¿qué software me recomiendan?`,
    author: 'student',
    contenido:
      'Me estoy volviendo loco con facturas en papel y excel. ¿Qué usan ustedes para manejar la contabilidad del negocio?',
    comments: [
      {
        oficio: 'finanzas',
        contenido:
          'QuickBooks Online es el estándar para contratistas en FL. ~$30/mes el plan básico. Te permite facturar, trackear gastos, hacer la nómina y sacar reportes para el contador.',
      },
      {
        oficio: 'general',
        contenido:
          'Yo uso Xero que me sale un poco más barato y tiene mejor app mobile. Lo importante es separar cuenta bancaria personal de la del negocio — eso te salva de dolores de cabeza con el IRS.',
      },
      {
        oficio: 'hvac',
        contenido:
          'Para mi rubro (HVAC) uso ServiceTitan para service calls + QuickBooks para contabilidad. Se integran bien. ServiceTitan es caro pero vale si hacés service no solo instalaciones.',
      },
    ],
  },
  {
    titulo: `${TAG} ¿Cómo se calcula el overhead en un presupuesto?`,
    author: 'student',
    contenido:
      'El examen tiene muchas preguntas de cálculo de overhead y sigo mezclando conceptos. ¿Alguien tiene un ejemplo práctico?',
    comments: [
      {
        oficio: 'finanzas',
        contenido:
          'Overhead es todo gasto que NO es directamente del trabajo: alquiler oficina, seguros, teléfono, sueldo tuyo como dueño, marketing, combustible, etc.\n\nFórmula simple:\nOverhead anual total / Ingresos anuales totales = % Overhead\n\nEjemplo: si gastás $50K de overhead y facturás $500K → tu overhead es 10%. En cada presupuesto agregás 10% sobre el costo directo para cubrirlo, y ARRIBA de eso la ganancia.',
      },
      {
        oficio: 'general',
        contenido:
          'Buen ejemplo. Yo agregaría que el examen distingue entre overhead general y overhead específico del proyecto — hay que leer bien la pregunta. Y la ganancia (profit) siempre va DESPUÉS del overhead, nunca mezclados.',
      },
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} Tip rápido: pruebas psicométricas antes del examen`,
    author: 'mentor',
    mentorOficio: 'general',
    contenido:
      'Algo que me funcionó mucho: los 7 días antes del examen, hacé 3-4 simulacros completos cronometrados. No leas más libros, solo simulacros. Tu cerebro se acostumbra al formato, a la presión del tiempo, y a cómo están redactadas las preguntas. El último día descansá, no estudies.',
    comments: [
      {
        oficio: 'electricidad',
        contenido:
          'Confirmo. Yo hice la última semana solo simulacros y pasé en el primer intento. La clave: revisar las que te equivocás y entender POR QUÉ era otra la respuesta.',
      },
      {
        oficio: 'plomeria',
        contenido:
          'Tip adicional: en el examen real, si una pregunta te traba más de 2 minutos, marcala y seguí. Volvé al final. No pierdas tiempo obsesionándote con una.',
      },
    ],
    resuelto: true,
  },
  {
    titulo: `${TAG} ¿Cómo defino mi precio por hora en un proyecto?`,
    author: 'student',
    contenido:
      'Tengo que cotizar mi primer proyecto grande de remodelación y no sé qué ponerle de mano de obra por hora. ¿Cómo calculan ustedes su rate?',
    comments: [
      {
        oficio: 'finanzas',
        contenido:
          'Fórmula que uso:\n1. Tu sueldo deseado al año (ej: $60K)\n2. Dividido en 1,800 horas facturables al año (no trabajás 2,080 — descuenta vacaciones, días sin venta, etc)\n3. Eso te da $33/h como COSTO\n4. Agregás overhead (~30%) → $43/h\n5. Agregás ganancia (~20%) → $52/h\n\nEso en residencial chico. En comercial podés subir a $70-90/h.',
      },
      {
        oficio: 'general',
        contenido:
          'Y no te olvides de cargar por los ayudantes separado. Si tu helper gana $18/h, lo cobrás a $28-32/h al cliente (incluyendo overhead + margen).',
      },
    ],
  },
]

async function getRootUser() {
  const { data, error } = await admin
    .from('profiles')
    .select('id, nombre_completo')
    .eq('rol', 'root')
    .maybeSingle()
  if (error || !data) throw new Error('No se encontró usuario root')
  return data
}

async function loadMentorsByOficio() {
  const { data } = await admin
    .from('profiles')
    .select('id, nombre_completo, oficio')
    .eq('es_mentor', true)

  const byOficio = {}
  for (const m of data || []) {
    if (m.oficio) byOficio[m.oficio] = m
  }
  return byOficio
}

async function cleanupExistingSeeds() {
  const { data: posts } = await admin
    .from('posts_comunidad')
    .select('id')
    .like('titulo', `${TAG}%`)

  if (!posts?.length) return 0
  const ids = posts.map((p) => p.id)
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
  const mentors = await loadMentorsByOficio()
  const mentorCount = Object.keys(mentors).length

  if (mentorCount < 3) {
    console.error(`❌ Solo hay ${mentorCount} mentores. Correr seed-mentors.mjs primero.`)
    process.exit(1)
  }

  console.log(`👤 Root: ${root.nombre_completo}`)
  console.log(`👥 Mentores: ${mentorCount} (${Object.keys(mentors).join(', ')})\n`)

  let created = 0
  let comments = 0

  for (const post of FAQ_POSTS) {
    // Skip if not clean mode and already exists
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

    // Resolve author
    let authorId
    if (post.author === 'mentor' && post.mentorOficio) {
      authorId = mentors[post.mentorOficio]?.id
    }
    if (!authorId) authorId = root.id // fallback

    const { data: newPost, error: postErr } = await admin
      .from('posts_comunidad')
      .insert({
        user_id: authorId,
        tipo: 'duda',
        titulo: post.titulo,
        contenido: post.contenido,
        resuelto: post.resuelto || false,
      })
      .select('id')
      .single()

    if (postErr || !newPost) {
      console.error(`  ❌ ${post.titulo.slice(0, 40)}: ${postErr?.message}`)
      continue
    }

    created++
    const authorName =
      authorId === root.id
        ? root.nombre_completo
        : Object.values(mentors).find((m) => m.id === authorId)?.nombre_completo
    console.log(`  ✅ [${authorName}] ${post.titulo.slice(0, 50)}...`)

    // Comments — use specified oficio mentor per comment
    for (const comment of post.comments || []) {
      const commenterId = mentors[comment.oficio]?.id || root.id
      const { error: cErr } = await admin.from('comentarios').insert({
        post_id: newPost.id,
        user_id: commenterId,
        contenido: comment.contenido,
      })
      if (!cErr) {
        comments++
        const commenterName =
          commenterId === root.id
            ? root.nombre_completo
            : Object.values(mentors).find((m) => m.id === commenterId)
                ?.nombre_completo
        console.log(`     💬 ${commenterName}`)
      }
    }
  }

  console.log(`\n🎉 ${created} posts + ${comments} comentarios creados.\n`)
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
