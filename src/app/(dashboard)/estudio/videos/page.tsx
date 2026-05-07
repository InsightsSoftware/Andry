import Link from 'next/link'
import {
  Video as VideoIcon,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSignedContentUrl } from '@/lib/supabase/storage'
import { formatSeconds } from '@/lib/utils'

export const metadata = { title: 'Videos' }

/**
 * Aggregated list of all videos across every course/chapter. Videos are used
 * for (a) explanatory content and (b) partner cards per the 21/4 feedback.
 * This page shows both, grouped by course.
 */
export default async function VideosPage() {
  const supabase = await createClient()

  const { data: videos } = await supabase
    .from('contenido')
    .select('*')
    .eq('tipo', 'video')
    .order('orden')

  // Filter out null before querying — Supabase .in() doesn't handle null values
  const capituloIds = Array.from(
    new Set(
      (videos || [])
        .map((v) => v.capitulo_id)
        .filter((id): id is string => id !== null)
    )
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const videoIds = (videos || []).map((v) => v.id)
  const { data: progreso } =
    user && videoIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, progreso_porcentaje, completado')
          .eq('user_id', user.id)
          .in('contenido_id', videoIds)
      : { data: [] }

  const capituloMap = new Map((capitulos || []).map((c) => [c.id, c]))
  const cursoMap = new Map((cursos || []).map((c) => [c.id, c]))
  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  // Resolve public URLs so the card can use <video preload="metadata"> to
  // auto-preview the first frame as thumbnail.
  const urlMap = new Map<string, string>()
  await Promise.all(
    (videos || []).map(async (v) => {
      try {
        const url = await getSignedContentUrl(supabase, v.archivo_url, 3600)
        urlMap.set(v.id, url)
      } catch {
        // Skip if URL cannot be generated — card falls back to placeholder.
      }
    })
  )

  type Group = {
    cursoId: string
    cursoNombre: string
    items: NonNullable<typeof videos>
  }
  const grupos = new Map<string, Group>()
  for (const v of videos || []) {
    const cap = v.capitulo_id ? capituloMap.get(v.capitulo_id) : null
    const curso = cap ? cursoMap.get(cap.curso_id) : null
    // Videos with no chapter go into a "Generales" group shown first
    const key = curso?.id || 'generales'
    if (!grupos.has(key)) {
      grupos.set(key, {
        cursoId: key,
        cursoNombre: curso?.nombre || 'Videos Generales',
        items: [],
      })
    }
    grupos.get(key)!.items.push(v)
  }
  for (const g of grupos.values()) {
    g.items.sort((a, b) => {
      const capA = a.capitulo_id ? capituloMap.get(a.capitulo_id) : null
      const capB = b.capitulo_id ? capituloMap.get(b.capitulo_id) : null
      if (capA && capB && capA.numero !== capB.numero)
        return capA.numero - capB.numero
      return a.orden - b.orden
    })
  }

  // Sort: "generales" (no chapter) always first, then by course name
  const gruposOrdenados = Array.from(grupos.values()).sort((a, b) => {
    if (a.cursoId === 'generales') return -1
    if (b.cursoId === 'generales') return 1
    return a.cursoNombre.localeCompare(b.cursoNombre)
  })

  const total = videos?.length || 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/20">
          <VideoIcon className="h-7 w-7 text-success-600 dark:text-success-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Videos de Aliados
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Recursos en video de nuestras empresas asociadas.
          </p>
        </div>
      </div>

      {/* Partner cards — one card per company/course */}
      {total > 0 ? (
        <div className="flex flex-col gap-5">
          {gruposOrdenados.map((grupo) => {
            const grupoCompletados = grupo.items.filter(
              (v) => progresoMap.get(v.id)?.completado
            ).length
            const grupoDuracion = grupo.items.reduce(
              (acc, v) => acc + (v.duracion_segundos || 0),
              0
            )

            return (
              <section
                key={grupo.cursoId}
                className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                {/* Partner header */}
                <div className="flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-5 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800">
                    <Building2 className="h-6 w-6 text-success-600 dark:text-success-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {grupo.cursoNombre}
                    </h2>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {grupo.items.length} video{grupo.items.length !== 1 ? 's' : ''}
                      {grupoDuracion > 0 && ` · ${formatSeconds(grupoDuracion)}`}
                      {grupoCompletados > 0 && ` · ${grupoCompletados} visto${grupoCompletados !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {grupoCompletados === grupo.items.length && grupo.items.length > 0 && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" />
                  )}
                </div>

                {/* Video list */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {grupo.items.map((video) => {
                    const progress = progresoMap.get(video.id)
                    const publicUrl = urlMap.get(video.id)
                    return (
                      <Link
                        key={video.id}
                        href={`/estudio/video/${video.id}`}
                        className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer"
                      >
                        {/* Mini thumbnail */}
                        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-success-500/10 to-neutral-100 dark:from-success-900/30 dark:to-neutral-800">
                          {publicUrl && (
                            <video
                              src={`${publicUrl}#t=1`}
                              preload="metadata"
                              muted
                              playsInline
                              aria-hidden="true"
                              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                            <PlayCircle className="h-6 w-6 text-white drop-shadow" />
                          </div>
                          {video.duracion_segundos && (
                            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-semibold text-white">
                              {formatSeconds(video.duracion_segundos)}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">
                            {video.titulo}
                          </p>
                          {progress && !progress.completado && (
                            <div className="mt-1.5 h-1 w-full max-w-[120px] rounded-full bg-neutral-100 dark:bg-neutral-800">
                              <div
                                className="h-1 rounded-full bg-success-500"
                                style={{ width: `${Math.round(progress.progreso_porcentaje)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* State */}
                        <div className="shrink-0">
                          {progress?.completado ? (
                            <CheckCircle2 className="h-5 w-5 text-success-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors" />
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los videos de aliados se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      )}
    </div>
  )
}
