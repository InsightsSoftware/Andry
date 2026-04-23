import Link from 'next/link'
import {
  FileText,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'PDFs' }

/**
 * Aggregated list of all PDF study guides across every course/chapter.
 * Grid of cards grouped by course, each card links to the PDF reader.
 */
export default async function PdfsPage() {
  const supabase = await createClient()

  const { data: pdfs } = await supabase
    .from('contenido')
    .select('*')
    .eq('tipo', 'pdf')
    .order('orden')

  const capituloIds = Array.from(
    new Set((pdfs || []).map((p) => p.capitulo_id))
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
  const pdfIds = (pdfs || []).map((p) => p.id)
  const { data: progreso } =
    user && pdfIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, progreso_porcentaje, completado')
          .eq('user_id', user.id)
          .in('contenido_id', pdfIds)
      : { data: [] }

  const capituloMap = new Map((capitulos || []).map((c) => [c.id, c]))
  const cursoMap = new Map((cursos || []).map((c) => [c.id, c]))
  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  type Group = {
    cursoId: string
    cursoNombre: string
    items: NonNullable<typeof pdfs>
  }
  const grupos = new Map<string, Group>()
  for (const p of pdfs || []) {
    const cap = capituloMap.get(p.capitulo_id)
    const curso = cap ? cursoMap.get(cap.curso_id) : null
    const key = curso?.id || 'sin-curso'
    if (!grupos.has(key)) {
      grupos.set(key, {
        cursoId: key,
        cursoNombre: curso?.nombre || 'Sin curso asignado',
        items: [],
      })
    }
    grupos.get(key)!.items.push(p)
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

  const total = pdfs?.length || 0
  const completados = (progreso || []).filter((p) => p.completado).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-danger-50 dark:bg-danger-900/20">
          <FileText className="h-7 w-7 text-danger-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            PDFs
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Guías de estudio y documentos — buscá por capítulo y marcá tu progreso.
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
              documentos disponibles
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Leídos
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
              Capítulos
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {capitulos?.length || 0}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              con material disponible
            </p>
          </div>
        </div>
      )}

      {/* Grid */}
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
                {grupo.items.map((pdf) => {
                  const cap = capituloMap.get(pdf.capitulo_id)
                  const progress = progresoMap.get(pdf.id)
                  return (
                    <Link
                      key={pdf.id}
                      href={`/estudio/pdf/${pdf.id}`}
                      className="group overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 transition-all hover:border-danger-300 dark:hover:border-danger-700 hover:shadow-md cursor-pointer"
                    >
                      {/* Cover area — red gradient + big file icon (could be
                          replaced by a real first-page thumbnail later) */}
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-danger-500/15 via-danger-600/5 to-neutral-100 dark:from-danger-900/40 dark:via-danger-950/20 dark:to-neutral-900 flex items-center justify-center">
                        <FileText className="h-16 w-16 text-danger-500/70 group-hover:scale-110 transition-transform" />
                        {progress?.completado && (
                          <span className="absolute top-2 right-2 rounded-full bg-success-500 p-1 z-10">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                          {pdf.titulo}
                        </p>
                        {cap && (
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            Cap. {cap.numero} · {cap.nombre}
                          </p>
                        )}
                        {progress && !progress.completado && (
                          <div className="mt-2 h-1 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div
                              className="h-1 rounded-full bg-danger-500 transition-all"
                              style={{
                                width: `${Math.round(progress.progreso_porcentaje)}%`,
                              }}
                            />
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400">
                          <span>Abrir PDF</span>
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
          <FileText className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los PDFs se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      )}
    </div>
  )
}
