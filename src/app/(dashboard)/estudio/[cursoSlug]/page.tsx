import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Headphones,
  Video,
  CheckCircle2,
  Search,
  Brain,
  FileCheck,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatSeconds } from '@/lib/utils'
import type { ContentType } from '@/types/database'
import { ChapterAccordion } from '@/components/estudio/chapter-accordion'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cursoSlug: string }>
}) {
  const { cursoSlug } = await params
  const supabase = await createClient()
  const { data: curso } = await supabase
    .from('cursos')
    .select('nombre')
    .eq('slug', cursoSlug)
    .single()

  return { title: curso?.nombre || 'Curso' }
}

const contentTypeConfig: Record<
  ContentType,
  { icon: typeof FileText; label: string; route: string; color: string }
> = {
  pdf: {
    icon: FileText,
    label: 'Guía PDF',
    route: '/estudio/pdf',
    color: 'text-danger-500',
  },
  audio: {
    icon: Headphones,
    label: 'Audio',
    route: '/estudio/audio',
    color: 'text-primary-600 dark:text-primary-400',
  },
  video: {
    icon: Video,
    label: 'Video',
    route: '/estudio/video',
    color: 'text-success-500',
  },
}

export default async function CursoDetailPage({
  params,
}: {
  params: Promise<{ cursoSlug: string }>
}) {
  const { cursoSlug } = await params
  const supabase = await createClient()

  // Fetch course
  const { data: curso } = await supabase
    .from('cursos')
    .select('*')
    .eq('slug', cursoSlug)
    .eq('activo', true)
    .single()

  if (!curso) notFound()

  // Fetch chapters with content
  const { data: capitulos } = await supabase
    .from('capitulos')
    .select('*')
    .eq('curso_id', curso.id)
    .order('numero')

  // Fetch all content for this course's chapters
  const capituloIds = (capitulos || []).map((c) => c.id)
  const { data: contenidos } = capituloIds.length
    ? await supabase
        .from('contenido')
        .select('*')
        .in('capitulo_id', capituloIds)
        .order('orden')
    : { data: [] }

  // Fetch user progress
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const contenidoIds = (contenidos || []).map((c) => c.id)
  const { data: progreso } =
    user && contenidoIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, progreso_porcentaje, completado')
          .eq('user_id', user.id)
          .in('contenido_id', contenidoIds)
      : { data: [] }

  // Map progress by content id
  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  // Group content by chapter
  const contenidosByCapitulo = new Map<string, typeof contenidos>()
  for (const c of contenidos || []) {
    const arr = contenidosByCapitulo.get(c.capitulo_id) || []
    arr.push(c)
    contenidosByCapitulo.set(c.capitulo_id, arr)
  }

  // Count questions per chapter
  const { data: preguntasCounts } = capituloIds.length
    ? await supabase
        .from('preguntas')
        .select('capitulo_id')
        .in('capitulo_id', capituloIds)
    : { data: [] }

  const preguntasByCapitulo = new Map<string, number>()
  for (const p of preguntasCounts || []) {
    preguntasByCapitulo.set(
      p.capitulo_id,
      (preguntasByCapitulo.get(p.capitulo_id) || 0) + 1
    )
  }
  const totalPreguntas = preguntasCounts?.length || 0

  // Calculate overall progress
  const totalContent = contenidoIds.length
  const completedContent = (progreso || []).filter((p) => p.completado).length
  const overallProgress =
    totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/estudio"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a cursos
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <BookOpen className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {curso.nombre}
            </h1>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">
              {curso.descripcion}
            </p>
          </div>
        </div>

        {/* Overall progress bar */}
        {totalContent > 0 && (
          <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Progreso general
              </span>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {overallProgress}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-2.5 rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
              {completedContent} de {totalContent} contenidos completados
            </p>
          </div>
        )}

        {/* Exam button */}
        {totalPreguntas > 0 && (
          <Link
            href="/estudio/examen"
            className="flex items-center gap-3 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4 transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/30"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 dark:bg-primary-500">
              <FileCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary-700 dark:text-primary-400">
                Examen Simulación Real
              </p>
              <p className="text-xs text-primary-600/70 dark:text-primary-400/60">
                {totalPreguntas} preguntas · Elegí 2 a 6 horas · Simula el examen oficial
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Chapters */}
      {capitulos && capitulos.length > 0 ? (
        <div className="flex flex-col gap-3">
          {capitulos.map((capitulo) => {
            const items = contenidosByCapitulo.get(capitulo.id) || []
            const chapterCompleted = items.every(
              (item) => progresoMap.get(item.id)?.completado
            )
            const chapterProgress = items.length
              ? Math.round(
                  (items.filter(
                    (item) => progresoMap.get(item.id)?.completado
                  ).length /
                    items.length) *
                    100
                )
              : 0

            // Identify the "main" PDF of the chapter — first PDF by orden.
            // This is shown as a prominent "Guía del capítulo" card so the
            // user can jump straight into reading without hunting through
            // a list. Secondary PDFs (if any) still appear in the list.
            const guiaCapitulo = items.find((i) => i.tipo === 'pdf') || null
            const otrosContenidos = items.filter((i) => i.id !== guiaCapitulo?.id)
            const guiaProgress = guiaCapitulo
              ? progresoMap.get(guiaCapitulo.id)
              : null

            return (
              <ChapterAccordion
                key={capitulo.id}
                capituloId={capitulo.id}
                numero={capitulo.numero}
                nombre={capitulo.nombre}
                descripcion={capitulo.descripcion}
                completed={chapterCompleted && items.length > 0}
                progress={chapterProgress}
                itemCount={items.length}
                hasGuia={guiaCapitulo !== null}
              >
                {items.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {/* ── Guía del capítulo — primary PDF, highlighted ── */}
                    {guiaCapitulo && (
                      <Link
                        href={`/estudio/pdf/${guiaCapitulo.id}`}
                        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-danger-200 dark:border-danger-800/50 bg-gradient-to-br from-danger-50 to-danger-50/50 p-4 transition-all hover:border-danger-300 hover:shadow-md dark:from-danger-900/20 dark:to-danger-900/5 dark:hover:border-danger-700"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-neutral-900">
                          <FileText className="h-6 w-6 text-danger-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-danger-600 dark:text-danger-400">
                              Guía del capítulo
                            </p>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-medium text-neutral-500 dark:bg-neutral-900/70 dark:text-neutral-400">
                              <Search className="h-2.5 w-2.5" />
                              Buscador
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {guiaCapitulo.titulo}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            Leé, buscá por palabra clave y marcá tu progreso
                          </p>
                        </div>
                        {guiaProgress?.completado ? (
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-success-500" />
                        ) : guiaProgress ? (
                          <span className="shrink-0 text-xs font-bold text-danger-600 dark:text-danger-400">
                            {Math.round(guiaProgress.progreso_porcentaje)}%
                          </span>
                        ) : (
                          <ArrowRight className="h-5 w-5 shrink-0 text-danger-500 transition-transform group-hover:translate-x-1" />
                        )}
                      </Link>
                    )}

                    {/* ── Audios, videos, y otros PDFs secundarios ── */}
                    {otrosContenidos.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {otrosContenidos.map((item) => {
                          const config = contentTypeConfig[item.tipo as ContentType]
                          const itemProgress = progresoMap.get(item.id)
                          const Icon = config.icon

                          return (
                            <Link
                              key={item.id}
                              href={`${config.route}/${item.id}`}
                              className="group flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-neutral-900 ${config.color}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                  {item.titulo}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                    {config.label}
                                  </span>
                                  {item.duracion_segundos && (
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                      · {formatSeconds(item.duracion_segundos)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {itemProgress?.completado ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" />
                              ) : itemProgress ? (
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 shrink-0">
                                  {Math.round(itemProgress.progreso_porcentaje)}%
                                </span>
                              ) : null}
                            </Link>
                          )
                        })}
                      </div>
                    )}

                    {/* Practice button */}
                    {(preguntasByCapitulo.get(capitulo.id) || 0) > 0 && (
                      <Link
                        href={`/estudio/practica/${capitulo.id}`}
                        className="flex items-center gap-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 p-3 transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/30"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 dark:bg-primary-500">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                            Practicar
                          </p>
                          <p className="text-xs text-primary-600/60 dark:text-primary-400/50">
                            {preguntasByCapitulo.get(capitulo.id)} preguntas
                          </p>
                        </div>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="py-3 text-center text-sm text-neutral-400 dark:text-neutral-500">
                    Sin contenido disponible aún
                  </p>
                )}
              </ChapterAccordion>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            El contenido de este curso se está preparando.
          </p>
        </div>
      )}
    </div>
  )
}
