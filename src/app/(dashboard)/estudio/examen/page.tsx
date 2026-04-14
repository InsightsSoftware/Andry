import Link from 'next/link'
import { ArrowLeft, FileCheck, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StartExamButton } from '@/components/estudio/start-exam-button'

export const metadata = { title: 'Simulacro de Examen' }

export default async function ExamenSelectPage() {
  const supabase = await createClient()

  // Fetch active courses
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug, descripcion')
    .eq('activo', true)
    .order('orden')

  // For each course, count available questions
  const cursosWithCounts = await Promise.all(
    (cursos || []).map(async (curso) => {
      const { data: capitulos } = await supabase
        .from('capitulos')
        .select('id')
        .eq('curso_id', curso.id)

      const capIds = (capitulos || []).map((c) => c.id)
      let questionCount = 0
      if (capIds.length) {
        const { count } = await supabase
          .from('preguntas')
          .select('id', { count: 'exact', head: true })
          .in('capitulo_id', capIds)
        questionCount = count || 0
      }

      return { ...curso, questionCount }
    })
  )

  return (
    <div>
      <Link
        href="/estudio"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a cursos
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Simulacro de Examen
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Practica como si fuera el examen real con tiempo límite
        </p>
      </div>

      {/* Info card */}
      <div className="mb-6 rounded-2xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-warning-800 dark:text-warning-300 mb-1">
              Instrucciones del simulacro
            </p>
            <ul className="text-warning-700 dark:text-warning-400 space-y-1">
              <li className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Tienes 90 minutos para completar el examen
              </li>
              <li>· Hasta 45 preguntas de opción múltiple</li>
              <li>· Puedes navegar entre preguntas libremente</li>
              <li>· Se envía automáticamente cuando se acaba el tiempo</li>
              <li>· Necesitas 70% para aprobar</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Course selection */}
      <div className="flex flex-col gap-4">
        {cursosWithCounts.map((curso) => (
          <div
            key={curso.id}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <FileCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                  {curso.nombre}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {curso.descripcion}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  {curso.questionCount} preguntas disponibles
                </p>
              </div>
            </div>
            <div className="mt-4">
              {curso.questionCount > 0 ? (
                <StartExamButton cursoId={curso.id} />
              ) : (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">
                  Sin preguntas disponibles aún
                </p>
              )}
            </div>
          </div>
        ))}

        {(!cursos || cursos.length === 0) && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              No hay cursos disponibles para examen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
