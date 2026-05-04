import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BookOpen,
  RotateCcw,
  Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatSeconds } from '@/lib/utils'

export const metadata = { title: 'Resultados' }

type PreguntaData = {
  id: string
  texto: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: 'a' | 'b' | 'c' | 'd'
  explicacion: string | null
  pagina_libro: number | null
  capitulo_id: string
  imagen_url: string | null
}

type RespuestaData = {
  id: string
  pregunta_id: string
  respuesta_seleccionada: 'a' | 'b' | 'c' | 'd'
  es_correcta: boolean
  created_at: string
}

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ sesionId: string }>
}) {
  const { sesionId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch session scoped to current user
  const { data: sesion } = await supabase
    .from('sesiones_examen')
    .select('*, cursos(slug, nombre)')
    .eq('id', sesionId)
    .eq('user_id', user.id)
    .single()

  if (!sesion) notFound()

  // Fetch all answers for this session
  const { data: respuestas } = await supabase
    .from('respuestas_usuario')
    .select('id, pregunta_id, respuesta_seleccionada, es_correcta, created_at')
    .eq('sesion_id', sesionId)
    .order('created_at')

  const respuestasMap = new Map<string, RespuestaData>(
    (respuestas || []).map((r) => [r.pregunta_id, r as RespuestaData])
  )

  // Fetch the pool of questions that were available for this session (so we
  // can also show the ones the user skipped without answering).
  let preguntasQuery = supabase
    .from('preguntas')
    .select(
      'id, texto, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, pagina_libro, capitulo_id, imagen_url'
    )

  if (sesion.capitulo_id) {
    preguntasQuery = preguntasQuery.eq('capitulo_id', sesion.capitulo_id)
  } else {
    const { data: capitulos } = await supabase
      .from('capitulos')
      .select('id')
      .eq('curso_id', sesion.curso_id)
    if (capitulos?.length) {
      preguntasQuery = preguntasQuery.in(
        'capitulo_id',
        capitulos.map((c) => c.id)
      )
    }
  }

  const { data: preguntasPool } = await preguntasQuery.limit(
    sesion.total_preguntas
  )

  // Only keep the questions that were part of this exam: answered ones are
  // the main source of truth, plus any pool question not yet shown counts
  // towards the "omitted" bucket.
  const preguntasEnExamen: PreguntaData[] = []
  const poolById = new Map<string, PreguntaData>()
  ;(preguntasPool || []).forEach((p) =>
    poolById.set(p.id, p as PreguntaData)
  )

  // First, add the pool in its original order up to total_preguntas
  for (const p of preguntasPool || []) {
    if (preguntasEnExamen.length >= sesion.total_preguntas) break
    preguntasEnExamen.push(p as PreguntaData)
  }

  // Ensure every answered question is represented (edge case: pool
  // rotated but answers stored from a previous set)
  for (const [preguntaId] of respuestasMap) {
    if (!preguntasEnExamen.some((p) => p.id === preguntaId)) {
      const fromPool = poolById.get(preguntaId)
      if (fromPool) preguntasEnExamen.push(fromPool)
    }
  }

  const cursoNombre =
    (sesion as { cursos?: { nombre?: string } }).cursos?.nombre || 'Curso'

  // Breakdown
  const correctas = preguntasEnExamen.filter(
    (p) => respuestasMap.get(p.id)?.es_correcta
  ).length
  const incorrectas = preguntasEnExamen.filter((p) => {
    const r = respuestasMap.get(p.id)
    return r && !r.es_correcta
  }).length
  const omitidas = preguntasEnExamen.filter((p) => !respuestasMap.has(p.id))
    .length

  const total = preguntasEnExamen.length
  const percentage = total > 0 ? Math.round((correctas / total) * 100) : 0
  const passed = percentage >= 70
  const isPractice = sesion.tipo === 'practica'

  return (
    <div>
      {/* Back link */}
      <Link
        href="/practica"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Práctica
      </Link>

      {/* Score card */}
      <div
        className={`rounded-2xl border p-8 text-center mb-6 ${
          passed
            ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20'
            : 'border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20'
        }`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-neutral-900 shadow-sm">
          <Trophy
            className={`h-8 w-8 ${passed ? 'text-success-500' : 'text-danger-500'}`}
          />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          {percentage}%
        </h1>
        <p
          className={`text-lg font-semibold mb-1 ${
            passed
              ? 'text-success-700 dark:text-success-400'
              : 'text-danger-600 dark:text-danger-400'
          }`}
        >
          {passed ? '¡Aprobado!' : 'No aprobado'}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {correctas} de {total} respuestas correctas
          {!isPractice && ' · Se necesita 70% para aprobar'}
        </p>

        {/* Time used */}
        {sesion.tiempo_usado_segundos && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            Tiempo: {formatSeconds(sesion.tiempo_usado_segundos)}
            {sesion.tiempo_limite_segundos && (
              <span>/ {formatSeconds(sesion.tiempo_limite_segundos)}</span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/practica"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Práctica
          </Link>
          <Link
            href="/practica"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 dark:bg-primary-500 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Practicar de nuevo
          </Link>
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 p-4 text-center">
          <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-success-500" />
          <div className="text-2xl font-bold text-success-700 dark:text-success-400">
            {correctas}
          </div>
          <div className="text-xs text-success-700/80 dark:text-success-400/80 font-medium">
            Correctas
          </div>
        </div>
        <div className="rounded-2xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-4 text-center">
          <XCircle className="mx-auto mb-1.5 h-6 w-6 text-danger-500" />
          <div className="text-2xl font-bold text-danger-600 dark:text-danger-400">
            {incorrectas}
          </div>
          <div className="text-xs text-danger-600/80 dark:text-danger-400/80 font-medium">
            Incorrectas
          </div>
        </div>
        <div className="rounded-2xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 p-4 text-center">
          <MinusCircle className="mx-auto mb-1.5 h-6 w-6 text-warning-500" />
          <div className="text-2xl font-bold text-warning-700 dark:text-warning-400">
            {omitidas}
          </div>
          <div className="text-xs text-warning-700/80 dark:text-warning-400/80 font-medium">
            Omitidas
          </div>
        </div>
      </div>

      {/* Question review */}
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Revisión detallada
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {preguntasEnExamen.map((pregunta, i) => {
          const respuesta = respuestasMap.get(pregunta.id)
          const estado: 'correcta' | 'incorrecta' | 'omitida' = respuesta
            ? respuesta.es_correcta
              ? 'correcta'
              : 'incorrecta'
            : 'omitida'

          const opciones = [
            { key: 'a' as const, text: pregunta.opcion_a },
            { key: 'b' as const, text: pregunta.opcion_b },
            { key: 'c' as const, text: pregunta.opcion_c },
            { key: 'd' as const, text: pregunta.opcion_d },
          ]

          const badgeStyles = {
            correcta: 'bg-success-500',
            incorrecta: 'bg-danger-500',
            omitida: 'bg-warning-500',
          }
          const badgeLabel = {
            correcta: 'Correcta',
            incorrecta: 'Incorrecta',
            omitida: 'Sin responder',
          }

          return (
            <div
              key={pregunta.id}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5"
            >
              {/* Question header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${badgeStyles[estado]}`}
                >
                  {estado === 'correcta' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : estado === 'incorrecta' ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <MinusCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                      #{i + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        estado === 'correcta'
                          ? 'text-success-600 dark:text-success-400'
                          : estado === 'incorrecta'
                            ? 'text-danger-600 dark:text-danger-400'
                            : 'text-warning-700 dark:text-warning-400'
                      }`}
                    >
                      {badgeLabel[estado]}
                    </span>
                  </div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed">
                    {pregunta.texto}
                  </p>
                </div>
              </div>

              {/* Options review */}
              <div className="flex flex-col gap-2 mb-3 ml-10">
                {opciones.map((op) => {
                  const isCorrect = op.key === pregunta.respuesta_correcta
                  const isSelected = op.key === respuesta?.respuesta_seleccionada
                  return (
                    <div
                      key={op.key}
                      className={`rounded-lg px-3 py-2 text-xs ${
                        isCorrect
                          ? 'bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-200 font-bold border-2 border-success-500 dark:border-success-400'
                          : isSelected && !respuesta?.es_correcta
                            ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 line-through'
                            : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      <span className="font-bold mr-1.5">
                        {op.key.toUpperCase()}.
                      </span>
                      {op.text}
                      {isCorrect && ' ✓'}
                    </div>
                  )
                })}
              </div>

              {/* Question image */}
              {pregunta.imagen_url && (
                <div className="ml-10 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pregunta.imagen_url}
                    alt="Imagen de la pregunta"
                    className="rounded-lg max-h-64 w-auto object-contain border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              )}

              {/* Explanation — green when correct, red when wrong, neutral when skipped */}
              {pregunta.explicacion && (
                <div
                  className={`ml-10 rounded-lg p-3 text-xs leading-relaxed ${
                    estado === 'correcta'
                      ? 'bg-success-50 dark:bg-success-900/20 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-800'
                      : estado === 'incorrecta'
                        ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-800'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="font-bold">Análisis:</span>{' '}{pregunta.explicacion}
                </div>
              )}

              {/* Page reference */}
              {pregunta.pagina_libro && pregunta.pagina_libro > 0 && (
                <div className="ml-10 mt-2 flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                  <BookOpen className="h-3 w-3" />
                  Página {pregunta.pagina_libro}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
