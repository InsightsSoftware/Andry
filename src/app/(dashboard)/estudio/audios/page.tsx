import Link from 'next/link'
import {
  Headphones,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatSeconds } from '@/lib/utils'

export const metadata = { title: 'Audios' }

/**
 * Aggregated list of all audios across every course/chapter. Groups by course
 * so the user can scan "all the audio material for my current course" without
 * clicking through chapters. Per feedback 21/4: no images in the audio list —
 * it's a long list and images would overwhelm.
 */
export default async function AudiosPage() {
  const supabase = await createClient()

  // Pull all audio content
  const { data: audios } = await supabase
    .from('contenido')
    .select('*')
    .eq('tipo', 'audio')
    .order('orden')

  // Resolve chapter + course context with two follow-up queries (matches the
  // existing course-page query style and avoids RLS surprises from nested
  // selects).
  const capituloIds = Array.from(
    new Set((audios || []).map((a) => a.capitulo_id))
  )
  const { data: capitulos } = capituloIds.length
    ? await supabase.from('capitulos').select('*').in('id', capituloIds)
    : { data: [] }

  const cursoIds = Array.from(
    new Set((capitulos || []).map((c) => c.curso_id))
  )
  const { data: cursos } = cursoIds.length
    ? await supabase.from('cursos').select('*').in('id', cursoIds)
    : { data: [] }

  // User progress
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const audioIds = (audios || []).map((a) => a.id)
  const { data: progreso } =
    user && audioIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, progreso_porcentaje, completado')
          .eq('user_id', user.id)
          .in('contenido_id', audioIds)
      : { data: [] }

  const capituloMap = new Map((capitulos || []).map((c) => [c.id, c]))
  const cursoMap = new Map((cursos || []).map((c) => [c.id, c]))
  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  // Group by course, sort by chapter number within each group
  type Group = {
    cursoId: string
    cursoNombre: string
    items: NonNullable<typeof audios>
  }
  const grupos = new Map<string, Group>()
  for (const a of audios || []) {
    const cap = capituloMap.get(a.capitulo_id)
    const curso = cap ? cursoMap.get(cap.curso_id) : null
    const key = curso?.id || 'sin-curso'
    if (!grupos.has(key)) {
      grupos.set(key, {
        cursoId: key,
        cursoNombre: curso?.nombre || 'Sin curso asignado',
        items: [],
      })
    }
    grupos.get(key)!.items.push(a)
  }
  for (const g of grupos.values()) {
    g.items.sort((a, b) => {
      const capA = capituloMap.get(a.capitulo_id)
      const capB = capituloMap.get(b.capitulo_id)
      if (capA && capB && capA.numero !== capB.numero)
        return capA.numero - capB.numero
      return a.orden - b.orden
    })
  }

  const total = audios?.length || 0
  const completados = (progreso || []).filter((p) => p.completado).length
  const totalDuracion = (audios || []).reduce(
    (acc, a) => acc + (a.duracion_segundos || 0),
    0
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
          <Headphones className="h-7 w-7 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Audios
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Audiolibros y explicaciones narradas. Escuchá mientras trabajás o
            manejás.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {total}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              audios disponibles
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Completados
            </p>
            <p className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">
              {completados}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              de {total}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 sm:col-span-1">
            <p className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Duración total
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {totalDuracion > 0 ? formatSeconds(totalDuracion) : '—'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              de contenido narrado
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {total > 0 ? (
        <div className="flex flex-col gap-6">
          {Array.from(grupos.values()).map((grupo) => (
            <section key={grupo.cursoId}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <BookOpen className="h-3.5 w-3.5" />
                {grupo.cursoNombre}
                <span className="ml-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {grupo.items.length}
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {grupo.items.map((audio) => {
                  const cap = capituloMap.get(audio.capitulo_id)
                  const progress = progresoMap.get(audio.id)
                  return (
                    <Link
                      key={audio.id}
                      href={`/estudio/audio/${audio.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md cursor-pointer"
                    >
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
                        <PlayCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {audio.titulo}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {cap && (
                            <span className="truncate">
                              Cap. {cap.numero} · {cap.nombre}
                            </span>
                          )}
                          {audio.duracion_segundos && cap && (
                            <span className="shrink-0">·</span>
                          )}
                          {audio.duracion_segundos && (
                            <span className="shrink-0">
                              {formatSeconds(audio.duracion_segundos)}
                            </span>
                          )}
                        </div>
                      </div>
                      {progress?.completado ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" />
                      ) : progress ? (
                        <span className="shrink-0 text-xs font-bold text-primary-600 dark:text-primary-400">
                          {Math.round(progress.progreso_porcentaje)}%
                        </span>
                      ) : (
                        <ArrowRight className="h-5 w-5 shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 transition-transform" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Headphones className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los audios se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      )}
    </div>
  )
}
