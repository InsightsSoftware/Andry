import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Duration string → seconds ────────────────────────────────────────────────
function duracionASegundos(d: string): number | null {
  const map: Record<string, number> = {
    'Sin límite': 0,
    '15 min':     15 * 60,
    '30 min':     30 * 60,
    '45 min':     45 * 60,
    '1 hora':     1  * 3600,
    '1.5 horas':  1.5 * 3600,
    '2 horas':    2  * 3600,
    '3 horas':    3  * 3600,
    '4 horas':    4  * 3600,
    '5 horas':    5  * 3600,
    '6 horas':    6  * 3600,
  }
  const secs = map[d]
  if (secs === undefined || secs === 0) return null // null = no time limit
  return secs
}

export default async function PracticaSesionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const fuente     = (params.fuente     as 'especifico' | 'random' | 'balanceado') ?? 'especifico'
  const cantidad   = Math.max(1, Math.min(200, parseInt(params.cantidad ?? '15', 10)))
  const duracion   = params.duracion ?? 'Sin límite'
  const tipo       = (params.tipo as 'libre' | 'examen') ?? 'libre'
  const capituloId = params.capitulo_id ?? null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Collect question IDs based on fuente ─────────────────────────────────
  let preguntaIds: string[] = []

  if (fuente === 'especifico' && capituloId) {
    // Questions from a specific chapter
    const { data } = await supabase
      .from('preguntas')
      .select('id')
      .eq('capitulo_id', capituloId)
      .limit(cantidad)
    preguntaIds = (data ?? []).map((p) => p.id)

  } else if (fuente === 'random') {
    // Random from ALL active courses
    const { data: cursos } = await supabase
      .from('cursos')
      .select('id')
      .eq('activo', true)
    const cursoIds = (cursos ?? []).map((c) => c.id)

    if (cursoIds.length) {
      const { data: caps } = await supabase
        .from('capitulos')
        .select('id')
        .in('curso_id', cursoIds)
      const capIds = (caps ?? []).map((c) => c.id)

      if (capIds.length) {
        const { data } = await supabase
          .from('preguntas')
          .select('id')
          .in('capitulo_id', capIds)
          .limit(cantidad)
        preguntaIds = (data ?? []).map((p) => p.id)
      }
    }

  } else if (fuente === 'balanceado') {
    // Equal distribution across chapters
    const { data: cursos } = await supabase
      .from('cursos')
      .select('id')
      .eq('activo', true)
    const cursoIds = (cursos ?? []).map((c) => c.id)

    if (cursoIds.length) {
      const { data: caps } = await supabase
        .from('capitulos')
        .select('id')
        .in('curso_id', cursoIds)
      const capIds = (caps ?? []).map((c) => c.id)

      if (capIds.length) {
        const perCap = Math.max(1, Math.ceil(cantidad / capIds.length))
        const results = await Promise.all(
          capIds.map((id) =>
            supabase
              .from('preguntas')
              .select('id')
              .eq('capitulo_id', id)
              .limit(perCap)
          )
        )
        for (const r of results) {
          preguntaIds.push(...(r.data ?? []).map((p) => p.id))
        }
        // Trim to requested amount
        preguntaIds = preguntaIds.slice(0, cantidad)
      }
    }
  }

  if (!preguntaIds.length) {
    // No questions available — go back with error
    redirect('/practica?error=sin_preguntas')
  }

  // ── Resolve cursoId (needed by sesiones_examen) ──────────────────────────
  let cursoId: string | null = null
  if (capituloId) {
    const { data } = await supabase
      .from('capitulos')
      .select('curso_id')
      .eq('id', capituloId)
      .single()
    cursoId = data?.curso_id ?? null
  } else {
    // Pick first active course as a fallback
    const { data } = await supabase
      .from('cursos')
      .select('id')
      .eq('activo', true)
      .order('orden')
      .limit(1)
      .single()
    cursoId = data?.id ?? null
  }

  // ── Create session ────────────────────────────────────────────────────────
  const tiempoLimite = duracionASegundos(duracion)

  const { data: sesion, error } = await supabase
    .from('sesiones_examen')
    .insert({
      user_id:                user.id,
      tipo:                   tipo === 'examen' ? 'examen' : 'practica',
      capitulo_id:            capituloId,
      curso_id:               cursoId,
      total_preguntas:        preguntaIds.length,
      respuestas_correctas:   0,
      tiempo_limite_segundos: tiempoLimite,
      completado:             false,
    })
    .select('id')
    .single()

  if (error || !sesion) {
    console.error('Error creating session:', error)
    redirect('/practica?error=sesion')
  }

  // ── Redirect to exam runner ───────────────────────────────────────────────
  redirect(`/estudio/examen/${sesion.id}`)
}
