import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  Headphones,
  Video,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ChapterGrid, type ChapterCard } from '@/components/estudio/chapter-grid'

export const metadata = { title: 'Modo Estudio' }

export default async function EstudioPage() {
  const supabase = await createClient()

  // Primary course — show its chapters as the main grid. For now there's
  // one live course (negocios-y-finanzas); if multiple become active we
  // can add a course switcher.
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug, descripcion')
    .eq('activo', true)
    .order('orden')

  const primaryCurso =
    cursos?.find((c) => c.slug === 'negocios-y-finanzas') ?? cursos?.[0] ?? null

  // Chapters of the primary course
  const { data: capitulos } = primaryCurso
    ? await supabase
        .from('capitulos')
        .select('id, numero, nombre')
        .eq('curso_id', primaryCurso.id)
        .order('numero')
    : { data: [] }

  // Resolve the main PDF per chapter for direct-open CTA
  const capituloIds = (capitulos || []).map((c) => c.id)
  const { data: pdfs } = capituloIds.length
    ? await supabase
        .from('contenido')
        .select('id, capitulo_id, orden, created_at')
        .eq('tipo', 'pdf')
        .in('capitulo_id', capituloIds)
        .order('orden', { ascending: true })
        .order('created_at', { ascending: true })
    : { data: [] }

  const pdfByCap = new Map<string, string>()
  for (const p of pdfs || []) {
    if (!pdfByCap.has(p.capitulo_id)) pdfByCap.set(p.capitulo_id, p.id)
  }

  const chapterCards: ChapterCard[] = (capitulos || []).map((cap) => {
    const pdfId = pdfByCap.get(cap.id)
    const isSupp = cap.numero >= 11
    return {
      id: cap.id,
      numero: cap.numero,
      nombre: cap.nombre,
      href: pdfId
        ? `/estudio/pdf/${pdfId}`
        : `/estudio/${primaryCurso?.slug ?? ''}#cap-${cap.numero}`,
      label: isSupp
        ? cap.numero === 11
          ? 'SUPLEMENTO AIA'
          : cap.numero === 12
            ? 'SUPLEMENTO CIRCULAR E'
            : `SUPLEMENTO ${cap.numero}`
        : `CAPÍTULO ${String(cap.numero).padStart(2, '0')}`,
    }
  })

  // Quick stats for the pdf/audio/video shortcuts (so mobile users — who
  // don't see the desktop sidebar — can still discover these sections).
  const [{ count: totalPdfs }, { count: totalAudios }, { count: totalVideos }] =
    await Promise.all([
      supabase
        .from('contenido')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', 'pdf'),
      supabase
        .from('contenido')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', 'audio'),
      supabase
        .from('contenido')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', 'video'),
    ])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Modo Estudio
      </h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        {primaryCurso
          ? primaryCurso.nombre
          : 'Selecciona un curso para comenzar a estudiar'}
      </p>

      {/* Quick access — PDFs / Audios / Videos */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Link
          href="/estudio/pdfs"
          className="group relative overflow-hidden rounded-2xl border border-danger-200 dark:border-danger-800/60 bg-gradient-to-br from-danger-50 to-danger-100/40 dark:from-danger-900/30 dark:to-danger-900/5 p-5 transition-all hover:shadow-lg hover:border-danger-300 dark:hover:border-danger-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
              <FileText className="h-6 w-6 text-danger-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                PDFs
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {totalPdfs ?? 0} guías disponibles
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-danger-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/estudio/audios"
          className="group relative overflow-hidden rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-gradient-to-br from-primary-50 to-primary-100/40 dark:from-primary-900/30 dark:to-primary-900/5 p-5 transition-all hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
              <Headphones className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Audios
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {totalAudios ?? 0} audiolibros disponibles
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/estudio/videos"
          className="group relative overflow-hidden rounded-2xl border border-success-200 dark:border-success-800/60 bg-gradient-to-br from-success-50 to-success-100/40 dark:from-success-900/30 dark:to-success-900/5 p-5 transition-all hover:shadow-lg hover:border-success-300 dark:hover:border-success-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
              <Video className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Videos
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {totalVideos ?? 0} videos disponibles
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-success-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Chapter grid — the main "Guía" view matching the reference design */}
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Guía de estudio
      </h2>
      <ChapterGrid
        chapters={chapterCards}
        courseName={primaryCurso?.nombre}
      />
    </div>
  )
}
