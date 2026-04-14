import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  RotateCcw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatSeconds } from '@/lib/utils'

export const metadata = { title: 'Resultados' }

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ sesionId: string }>
}) {
  const { sesionId } = await params
  const supabase = await createClient()

  // Fetch session with course info
  const { data: sesion } = await supabase
    .from('sesiones_examen')
    .select('*, cursos(slug, nombre)')
    .eq('id', sesionId)
    .single()

  if (!sesion) notFound()

  // Fetch all answers with question details
  const { data: respuestas } = await supabase
    .from('respuestas_usuario')
    .select(
      '*, preguntas(texto, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, pagina_libro)'
    )
    .eq('sesion_id', sesionId)
    .order('created_at')

  const cursoSlug = (sesion as any).cursos?.slug || ''
  const cursoNombre = (sesion as any).cursos?.nombre || 'Curso'
  const score = sesion.respuestas_correctas
  const total = sesion.total_preguntas
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const passed = percentage >= 70
  const isPractice = sesion.tipo === 'practica'

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/estudio/${cursoSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {cursoNombre}
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
            className={`h-8 w-8 ${
              passed
                ? 'text-success-500'
                : 'text-danger-500'
            }`}
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
          {score} de {total} respuestas correctas
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
            href={`/estudio/${cursoSlug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al curso
          </Link>
          {isPractice && sesion.capitulo_id && (
            <Link
              href={`/estudio/practica/${sesion.capitulo_id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 dark:bg-primary-500 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Practicar de nuevo
            </Link>
          )}
        </div>
      </div>

      {/* Question review */}
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
        Revisión de Respuestas
      </h2>

      <div className="flex flex-col gap-4">
        {(respuestas || []).map((resp, i) => {
          const pregunta = (resp as any).preguntas
          if (!pregunta) return null

          const opciones = [
            { key: 'a', text: pregunta.opcion_a },
            { key: 'b', text: pregunta.opcion_b },
            { key: 'c', text: pregunta.opcion_c },
            { key: 'd', text: pregunta.opcion_d },
          ]

          return (
            <div
              key={resp.id}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5"
            >
              {/* Question header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    resp.es_correcta ? 'bg-success-500' : 'bg-danger-500'
                  }`}
                >
                  {resp.es_correcta ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed">
                  {pregunta.texto}
                </p>
              </div>

              {/* Options review */}
              <div className="flex flex-col gap-2 mb-3 ml-10">
                {opciones.map((op) => {
                  const isCorrect = op.key === pregunta.respuesta_correcta
                  const isSelected = op.key === resp.respuesta_seleccionada
                  return (
                    <div
                      key={op.key}
                      className={`rounded-lg px-3 py-2 text-xs ${
                        isCorrect
                          ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 font-semibold'
                          : isSelected && !resp.es_correcta
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

              {/* Explanation */}
              {pregunta.explicacion && (
                <div className="ml-10 rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {pregunta.explicacion}
                </div>
              )}

              {/* Page reference */}
              {pregunta.pagina_libro > 0 && (
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
