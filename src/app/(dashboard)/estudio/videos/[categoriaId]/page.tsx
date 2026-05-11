import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Video as VideoIcon,
  CheckCircle2,
  PlayCircle,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSignedContentUrl } from '@/lib/supabase/storage'
import { formatSeconds } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoriaId: string }>
}) {
  const { categoriaId } = await params
  const admin = createAdminClient()
  const { data } = await admin
    .from('video_categorias')
    .select('nombre')
    .eq('id', categoriaId)
    .single()
  return { title: data?.nombre || 'Videos' }
}

export default async function VideosCategoriaPage({
  params,
}: {
  params: Promise<{ categoriaId: string }>
}) {
  const { categoriaId } = await params
  const admin = createAdminClient()
  const supabase = await createClient()

  // Fetch category (must be active)
  const { data: categoria } = await admin
    .from('video_categorias')
    .select('id, nombre, descripcion, imagen_url')
    .eq('id', categoriaId)
    .eq('activo', true)
    .single()

  if (!categoria) notFound()

  // Fetch videos in this category
  const { data: videos } = await admin
    .from('contenido')
    .select('id, titulo, descripcion, archivo_url, duracion_segundos, orden')
    .eq('tipo', 'video')
    .eq('video_categoria_id', categoriaId)
    .order('orden')

  const videoList = videos || []

  // User progress
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const videoIds = videoList.map((v) => v.id)
  const { data: progreso } =
    user && videoIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, progreso_porcentaje, completado')
          .eq('user_id', user.id)
          .in('contenido_id', videoIds)
      : { data: [] }

  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  // Signed URLs for thumbnails
  const urlMap = new Map<string, string>()
  await Promise.all(
    videoList.map(async (v) => {
      try {
        const url = await getSignedContentUrl(supabase, v.archivo_url, 3600)
        urlMap.set(v.id, url)
      } catch {
        // Falls back to placeholder
      }
    })
  )

  const completados = videoList.filter(
    (v) => progresoMap.get(v.id)?.completado
  ).length
  const duracionTotal = videoList.reduce(
    (acc, v) => acc + (v.duracion_segundos || 0),
    0
  )

  return (
    <div>
      {/* Back + header */}
      <div className="mb-5">
        <Link
          href="/estudio/videos"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Videos
        </Link>

        {/* Category header card */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/20">
              <VideoIcon className="h-6 w-6 text-success-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {categoria.nombre}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {videoList.length} video{videoList.length !== 1 ? 's' : ''}
                {duracionTotal > 0 && ` · ${formatSeconds(duracionTotal)}`}
                {completados > 0 &&
                  ` · ${completados} visto${completados !== 1 ? 's' : ''}`}
              </p>
              {categoria.descripcion && (
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {categoria.descripcion}
                </p>
              )}
            </div>
            {completados === videoList.length && videoList.length > 0 && (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-success-500" />
            )}
          </div>
        </div>
      </div>

      {/* Video list */}
      {videoList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Esta categoría no tiene videos todavía.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
          {videoList.map((video) => {
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
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1 leading-snug">
                    {video.titulo}
                  </p>
                  {video.descripcion && (
                    <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 line-clamp-2 leading-relaxed">
                      {video.descripcion}
                    </p>
                  )}
                  {progress && !progress.completado && (
                    <div className="mt-1.5 h-1 w-full max-w-[120px] rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-1 rounded-full bg-success-500"
                        style={{
                          width: `${Math.round(progress.progreso_porcentaje)}%`,
                        }}
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
      )}
    </div>
  )
}
