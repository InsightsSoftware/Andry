import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  Headphones,
  Video,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ChapterGrid, type ChapterCard } from '@/components/estudio/chapter-grid'

export const metadata = { title: 'Modo Estudio' }

export default async function EstudioPage() {
  const supabase = await createClient()

  // All active courses — each gets its own chapter grid section below.
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug, descripcion')
    .eq('activo', true)
    .order('orden')

  // All chapters for all courses — single query, group client-side
  const cursoIds = (cursos || []).map((c) => c.id)
  const { data: capitulos } = cursoIds.length
    ? await supabase
        .from('capitulos')
        .select('id, curso_id, numero, nombre')
        .in('curso_id', cursoIds)
        .order('numero')
    : { data: [] }

  // Quick stats for the pdf/audio/video shortcuts (global across courses)
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

  // Group chapters by course
  const chaptersByCurso = new Map<string, typeof capitulos>()
  for (const cap of capitulos || []) {
    const arr = chaptersByCurso.get(cap.curso_id) ?? []
    arr.push(cap)
    chaptersByCurso.set(cap.curso_id, arr)
  }

  function makeCards(
    caps: NonNullable<typeof capitulos>,
    cursoSlug: string
  ): ChapterCard[] {
    return caps.map((cap) => {
      const isSupp = cap.numero >= 11
      return {
        id: cap.id,
        numero: cap.numero,
        nombre: cap.nombre,
        href: `/estudio/${cursoSlug}#cap-${cap.id}`,
        label: isSupp
          ? cap.numero === 11
            ? 'SUPLEMENTO AIA'
            : cap.numero === 12
              ? 'SUPLEMENTO CIRCULAR E'
              : `SUPLEMENTO ${cap.numero}`
          : `CAPÍTULO ${String(cap.numero).padStart(2, '0')}`,
      }
    })
  }

  const cursosList = cursos || []
  const multiCourse = cursosList.length > 1

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Modo Estudio
      </h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        {cursosList.length === 0
          ? 'Los cursos se están preparando.'
          : multiCourse
            ? `${cursosList.length} cursos activos`
            : cursosList[0].nombre}
      </p>

      {/* Quick access — PDFs / Audios / Videos (global) */}
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

      {/* Empty state */}
      {cursosList.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los cursos se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      )}

      {/* One section per active course */}
      {cursosList.map((curso, idx) => {
        const caps = chaptersByCurso.get(curso.id) ?? []
        const cards = makeCards(caps, curso.slug)

        return (
          <section
            key={curso.id}
            className={idx > 0 ? 'mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800' : ''}
          >
            {multiCourse ? (
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {curso.nombre}
                </h2>
                <Link
                  href={`/estudio/${curso.slug}`}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center gap-1"
                >
                  Ver curso completo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Guía de estudio
              </h2>
            )}

            {cards.length > 0 ? (
              <ChapterGrid chapters={cards} courseName={curso.nombre} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-8 text-center">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Sin capítulos todavía en este curso.
                </p>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
