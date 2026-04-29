import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Timer, BookOpenCheck, ArrowRight, ChevronRight, Layers } from 'lucide-react'

export const metadata = { title: 'Práctica y Examen' }

export default async function PracticaIndexPage() {
  const supabase = await createClient()

  // Load active courses + their chapters (for the chapter picker section)
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('orden')

  const cursosConCapitulos = await Promise.all(
    (cursos || []).map(async (curso) => {
      const { data: capitulos } = await supabase
        .from('capitulos')
        .select('id, nombre, numero')
        .eq('curso_id', curso.id)
        .order('numero')

      // Count questions per chapter
      const capitulosConPreguntas = await Promise.all(
        (capitulos || []).map(async (cap) => {
          const { count } = await supabase
            .from('preguntas')
            .select('id', { count: 'exact', head: true })
            .eq('capitulo_id', cap.id)
          return { ...cap, questionCount: count || 0 }
        })
      )

      return { ...curso, capitulos: capitulosConPreguntas }
    })
  )

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-neutral-900 dark:text-white">
        Práctica y Examen
      </h1>
      <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        Elegí el modo que mejor se adapta a tu sesión de hoy
      </p>

      {/* Mode cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {/* Simulación Real */}
        <Link
          href="/estudio/examen"
          className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-warning-900/10 cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/40 border border-warning-200 dark:border-warning-700">
            <Timer className="h-6 w-6 text-warning-600 dark:text-warning-400" />
          </div>
          <div className="flex-1">
            <h2 className="mb-1.5 font-bold text-neutral-900 dark:text-neutral-100 text-lg">
              Simulación Real
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Examen con tiempo (2–6 horas), preguntas aleatorias y balanceadas.
              Se envía automáticamente cuando se acaba el tiempo.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-warning-500" />
                Simula el examen oficial de licencia
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-warning-500" />
                Requiere 70% para aprobar
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-warning-500" />
                Marcá preguntas con bandera para revisar
              </li>
            </ul>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning-700 dark:text-warning-400 transition-all group-hover:gap-2">
            Comenzar examen
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        {/* Práctica libre */}
        <div className="flex flex-col gap-4 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-700">
            <BookOpenCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="mb-1.5 font-bold text-neutral-900 dark:text-neutral-100 text-lg">
              Práctica Libre
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Sin reloj ni presión. Elegí un capítulo y practicá a tu ritmo.
              Ideal para reforzar temas antes del examen.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary-500" />
                Sin tiempo límite — avanzá a tu ritmo
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary-500" />
                Feedback inmediato por pregunta
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary-500" />
                Elegí el capítulo que querés repasar
              </li>
            </ul>
          </div>
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">
            Seleccioná un capítulo abajo ↓
          </p>
        </div>
      </div>

      {/* Chapter picker for Práctica */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Practicar por capítulo
          </h2>
        </div>

        {cursosConCapitulos.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              No hay cursos disponibles aún.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {cursosConCapitulos.map((curso) => (
            <div key={curso.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {curso.nombre}
              </p>
              <div className="flex flex-col gap-2">
                {curso.capitulos.map((cap) => (
                  <div key={cap.id}>
                    {cap.questionCount > 0 ? (
                      <Link
                        href={`/estudio/practica/${cap.id}`}
                        className="group flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                            {cap.numero}
                          </span>
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            {cap.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            {cap.questionCount} preguntas
                          </span>
                          <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 transition-colors group-hover:text-primary-500 dark:group-hover:text-primary-400" />
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 px-4 py-3 opacity-50">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-400">
                            {cap.numero}
                          </span>
                          <span className="text-sm text-neutral-500 dark:text-neutral-500">
                            {cap.nombre}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400 dark:text-neutral-600 italic">
                          Sin preguntas
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
