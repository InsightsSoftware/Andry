import Link from 'next/link'
import {
  Video as VideoIcon,
  CheckCircle2,
  PlayCircle,
  FolderOpen,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatSeconds } from '@/lib/utils'

export const metadata = { title: 'Videos' }

export default async function VideosPage() {
  const admin = createAdminClient()
  const supabase = await createClient()

  // Fetch all active categories + all videos (with category assignment)
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

  // Fetch user progress for video completion counts
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

  // Videos that belong to a category
  const catVideoMap = new Map<string, typeof videos>()
  for (const cat of cats) {
    catVideoMap.set(
      cat.id,
      videos.filter((v) => v.video_categoria_id === cat.id)
    )
  }

  // Videos with no category — shown in a separate section below
  const sinCategoria = videos.filter((v) => v.video_categoria_id === null)

  const hasCats = cats.length > 0
  const total = videos.length

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
            Contenido en video para tu preparación.
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los videos se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Category cards grid */}
          {hasCats && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cats.map((cat) => {
                const catVideos = catVideoMap.get(cat.id) || []
                const completados = catVideos.filter(
                  (v) => progresoMap.get(v.id)?.completado
                ).length
                const duracion = catVideos.reduce(
                  (acc, v) => acc + (v.duracion_segundos || 0),
                  0
                )
                const allDone =
                  catVideos.length > 0 && completados === catVideos.length

                return (
                  <Link
                    key={cat.id}
                    href={`/estudio/videos/${cat.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-success-400 dark:hover:border-success-600 transition-colors"
                  >
                    {/* Thumbnail / cover */}
                    <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-success-500/10 to-neutral-100 dark:from-success-900/30 dark:to-neutral-800">
                      {cat.imagen_url ? (
                        <img
                          src={cat.imagen_url}
                          alt={cat.nombre}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <FolderOpen className="h-14 w-14 text-success-400/50 group-hover:text-success-500/60 transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      {allDone && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-5 w-5 text-success-400 drop-shadow" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 items-end justify-between gap-2 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {cat.nombre}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {catVideos.length} video{catVideos.length !== 1 ? 's' : ''}
                          {duracion > 0 && ` · ${formatSeconds(duracion)}`}
                          {completados > 0 && ` · ${completados} visto${completados !== 1 ? 's' : ''}`}
                        </p>
                        {cat.descripcion && (
                          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 line-clamp-2">
                            {cat.descripcion}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-success-500 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Videos with no category (always shown below categories) */}
          {sinCategoria.length > 0 && (
            <section>
              {hasCats && (
                <h2 className="mb-3 font-semibold text-neutral-700 dark:text-neutral-300">
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
                      {/* Mini thumbnail placeholder */}
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-success-500/10 to-neutral-100 dark:from-success-900/30 dark:to-neutral-800">
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
                          <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors" />
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
