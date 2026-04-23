import Link from 'next/link'
import {
  Video as VideoIcon,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
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

  const capituloIds = Array.from(
    new Set((videos || []).map((v) => v.capitulo_id))
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
    const cap = capituloMap.get(v.capitulo_id)
    const curso = cap ? cursoMap.get(cap.curso_id) : null
    const key = curso?.id || 'sin-curso'
    if (!grupos.has(key)) {
      grupos.set(key, {
        cursoId: key,
        cursoNombre: curso?.nombre || 'Sin curso asignado',
        items: [],
      })
    }
    grupos.get(key)!.items.push(v)
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

  const total = videos?.length || 0
  const completados = (progreso || []).filter((p) => p.completado).length
  const totalDuracion = (videos || []).reduce(
    (acc, v) => acc + (v.duracion_segundos || 0),
    0
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/20">
          <VideoIcon className="h-7 w-7 text-success-600 dark:text-success-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Videos
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Explicaciones, tutoriales y videos de nuestros aliados.
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
              videos disponibles
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Vistos
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
              de material en video
            </p>
          </div>
        </div>
      )}

      {/* Grid of videos */}
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grupo.items.map((video) => {
                  const cap = capituloMap.get(video.capitulo_id)
                  const progress = progresoMap.get(video.id)
                  const publicUrl = urlMap.get(video.id)
                  return (
                    <Link
                      key={video.id}
                      href={`/estudio/video/${video.id}`}
                      className="group overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 transition-all hover:border-success-300 dark:hover:border-success-700 hover:shadow-md cursor-pointer"
                    >
                      {/* Thumbnail area — auto-preview from the video first
                          frame via <video preload="metadata">. The #t=1
                          fragment seeks past any initial black frames. */}
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-success-500/10 via-success-600/5 to-neutral-100 dark:from-success-900/30 dark:via-success-950/20 dark:to-neutral-900">
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
                        {/* Subtle darkening for play button contrast */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-lg group-hover:scale-110 transition-transform">
                            <PlayCircle className="h-8 w-8 text-success-600 dark:text-success-400" />
                          </div>
                        </div>
                        {video.duracion_segundos && (
                          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white z-10">
                            {formatSeconds(video.duracion_segundos)}
                          </span>
                        )}
                        {progress?.completado && (
                          <span className="absolute top-2 right-2 rounded-full bg-success-500 p-1 z-10">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                          {video.titulo}
                        </p>
                        {cap && (
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            Cap. {cap.numero} · {cap.nombre}
                          </p>
                        )}
                        {progress && !progress.completado && (
                          <div className="mt-2 h-1 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div
                              className="h-1 rounded-full bg-success-500 transition-all"
                              style={{
                                width: `${Math.round(progress.progreso_porcentaje)}%`,
                              }}
                            />
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success-600 dark:text-success-400">
                          <span>Ver video</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los videos se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      )}
    </div>
  )
}
