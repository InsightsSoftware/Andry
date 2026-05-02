import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PDFViewer } from '@/components/estudio/pdf-viewer'
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

  return { title: data?.titulo || 'Visor PDF' }
}

export default async function PDFViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch content item with chapter info
  const { data: contenido } = await supabase
    .from('contenido')
    .select('*, capitulos(nombre, curso_id, cursos(slug, nombre))')
    .eq('id', id)
    .eq('tipo', 'pdf')
    .single()

  if (!contenido) notFound()

  // Get existing progress
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let initialProgress = 0
  if (user) {
    const { data: progreso } = await supabase
      .from('progreso_estudio')
      .select('progreso_porcentaje, ultima_posicion')
      .eq('user_id', user.id)
      .eq('contenido_id', id)
      .single()
    if (progreso) initialProgress = progreso.progreso_porcentaje
  }

  const cursoSlug = (contenido as any).capitulos?.cursos?.slug || ''
  const cursoNombre = (contenido as any).capitulos?.cursos?.nombre || 'Curso'
  const capituloNombre = (contenido as any).capitulos?.nombre || ''

  // Generate a short-lived signed URL — content bucket is private
  let signedUrl: string
  try {
    signedUrl = await getSignedContentUrl(supabase, contenido.archivo_url, 3600)
  } catch (err) {
    console.error('Signed URL error:', err)
    notFound()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.12))]">
      {/* Header */}
      <div className="mb-3 shrink-0">
        <Link
          href="/estudio"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {cursoNombre}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger-50 dark:bg-danger-900/20">
            <FileText className="h-5 w-5 text-danger-500" />
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

      {/* PDF Viewer */}
      <PDFViewer
        contenidoId={id}
        archivoUrl={signedUrl}
        initialProgress={initialProgress}
      />
    </div>
  )
}
