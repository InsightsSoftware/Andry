import Link from 'next/link'
import {
  Video as VideoIcon,
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatSeconds } from '@/lib/utils'

export const metadata = { title: 'Videos' }

export default async function VideosPage() {
  const admin = createAdminClient()
  const supabase = await createClient()

  const [{ data: categorias }, { data: allVideos }] = await Promise.all([
    admin
      .from('video_categorias')
      .select('id, nombre, descripcion, imagen_url, orden')
      .eq('activo', true)
      .order('orden'),
    admin
      .from('contenido')
      .select('id, titulo, duracion_segundos, video_categoria_id')
      .eq('tipo', 'video')
      .order('orden'),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const videoIds = (allVideos || []).map((v) => v.id)
  const { data: progreso } =
    user && videoIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, completado')
          .eq('user_id', user.id)
          .in('contenido_id', videoIds)
      : { data: [] }

  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  const videos = allVideos || []
  const cats = categorias || []

  const catVideoMap = new Map<string, typeof videos>()
  for (const cat of cats) {
    catVideoMap.set(
      cat.id,
      videos.filter((v) => v.video_categoria_id === cat.id)
    )
  }

  const sinCategoria = videos.filter((v) => v.video_categoria_id === null)
  const total = videos.length

  return (
    <div>
      {/* Header */}
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Videos
      </h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        {total === 0
          ? 'Los videos se están preparando.'
          : cats.length === 1
            ? cats[0].nombre
            : cats.length > 1
              ? `${cats.length} categorías disponibles`
              : 'Contenido en video para tu preparación.'}
      </p>

      {total === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los videos se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {/* Category cards — same style as audio chapter cards */}
          {cats.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cats.map((cat, idx) => {
                const catVideos = catVideoMap.get(cat.id) || []
                const completados = catVideos.filter(
                  (v) => progresoMap.get(v.id)?.completado
                ).length
                const allDone = catVideos.length > 0 && completados === catVideos.length
                const videoCount = catVideos.length

                return (
                  <Link
                    key={cat.id}
                    href={`/estudio/videos/${cat.id}`}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-7 text-left transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md min-h-[200px] cursor-pointer"
                  >
                    {/* Glow */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary-500/20 opacity-40 blur-2xl" />

                    {/* Label */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                        {`CATEGORÍA ${String(idx + 1).padStart(2, '0')}`}
                      </span>
                      {allDone && (
                        <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="flex-1 text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-3">
                      {cat.nombre}
                    </h3>

                    {/* Video count */}
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                      <VideoIcon className="h-3.5 w-3.5" />
                      {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                      {completados > 0 && ` · ${completados} visto${completados !== 1 ? 's' : ''}`}
                    </p>

                    {/* CTA */}
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
                      Ver videos
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Videos sin categoría */}
          {sinCategoria.length > 0 && (
            <section>
              {cats.length > 0 && (
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  Videos generales
                </h2>
              )}
              <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
                {sinCategoria.map((video) => {
                  const progress = progresoMap.get(video.id)
                  return (
                    <Link
                      key={video.id}
                      href={`/estudio/video/${video.id}`}
                      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer"
                    >
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary-500/10 to-neutral-100 dark:from-primary-900/30 dark:to-neutral-800">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                          <PlayCircle className="h-6 w-6 text-white drop-shadow" />
                        </div>
                        {video.duracion_segundos && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-semibold text-white">
                            {formatSeconds(video.duracion_segundos)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1 leading-snug">
                          {video.titulo}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {progress?.completado ? (
                          <CheckCircle2 className="h-5 w-5 text-success-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 transition-colors" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
