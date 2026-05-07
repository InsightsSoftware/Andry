import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/estudio/video-player'
import { getSignedContentUrl } from '@/lib/supabase/storage'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('contenido')
    .select('titulo')
    .eq('id', id)
    .single()

  return { title: data?.titulo || 'Reproductor de Video' }
}

export default async function VideoPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch content item with chapter + category info
  const { data: contenido } = await supabase
    .from('contenido')
    .select('*, capitulos(nombre, curso_id, cursos(slug, nombre)), video_categoria_id')
    .eq('id', id)
    .eq('tipo', 'video')
    .single()

  if (!contenido) notFound()

  // Get existing progress
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let initialProgress = 0
  let initialPosition = '0'
  if (user) {
    const { data: progreso } = await supabase
      .from('progreso_estudio')
      .select('progreso_porcentaje, ultima_posicion')
      .eq('user_id', user.id)
      .eq('contenido_id', id)
      .single()
    if (progreso) {
      initialProgress = progreso.progreso_porcentaje
      initialPosition = progreso.ultima_posicion || '0'
    }
  }

  const cursoSlug = (contenido as any).capitulos?.cursos?.slug || ''
  const cursoNombre = (contenido as any).capitulos?.cursos?.nombre || ''
  const capituloNombre = (contenido as any).capitulos?.nombre || ''
  const videoCategoriaId = (contenido as any).video_categoria_id || null

  // Back button priority:
  //   1. If linked to a course chapter → go to the course page
  //   2. If linked to a video category → go to that category page
  //   3. Otherwise → back to the flat videos list
  let backHref = '/estudio/videos'
  let backLabel = 'Videos'
  if (cursoSlug) {
    backHref = `/estudio/${cursoSlug}`
    backLabel = cursoNombre || 'Curso'
  } else if (videoCategoriaId) {
    backHref = `/estudio/videos/${videoCategoriaId}`
    backLabel = 'Videos'
  }

  // Generate a short-lived signed URL — content bucket is private
  let signedUrl: string
  try {
    signedUrl = await getSignedContentUrl(supabase, contenido.archivo_url, 3600)
  } catch (err) {
    console.error('Signed URL error:', err)
    notFound()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50 dark:bg-success-900/20">
            <Video className="h-5 w-5 text-success-500" />
          </div>
          <div>
            <h1 className="font-bold text-neutral-900 dark:text-neutral-100">
              {contenido.titulo}
            </h1>
            {capituloNombre && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {capituloNombre}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      <VideoPlayer
        contenidoId={id}
        archivoUrl={signedUrl}
        initialProgress={initialProgress}
        initialPosition={initialPosition}
      />

      {/* Description */}
      {contenido.descripcion && (
        <div className="mt-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-100">
            Descripción
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {contenido.descripcion}
          </p>
        </div>
      )}
    </div>
  )
}
