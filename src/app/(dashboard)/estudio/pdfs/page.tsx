import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PdfsFilter } from '@/components/estudio/pdfs-filter'

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

  const progresoMap = Object.fromEntries(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  const sortedPdfs = (pdfs || []).slice().sort((a, b) => {
    const capA = (capitulos || []).find((c) => c.id === a.capitulo_id)
    const capB = (capitulos || []).find((c) => c.id === b.capitulo_id)
    if (capA && capB && capA.numero !== capB.numero) return capA.numero - capB.numero
    return a.orden - b.orden
  })

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

      {/* Filtered grid — client component with chapter chips + search */}
      {total > 0 ? (
        <PdfsFilter
          pdfs={sortedPdfs}
          capitulos={capitulos || []}
          progresoMap={progresoMap}
        />
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
