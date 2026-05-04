import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type ChapterCard } from '@/components/estudio/chapter-grid'
import { CursoPicker } from '@/components/estudio/curso-picker'

export const metadata = { title: 'Guía' }

export default async function EstudioPage() {
  const supabase = await createClient()

  // Check if current user is admin/root
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.rol === 'admin' || profile?.rol === 'root'
  }

  // All active courses — each gets its own chapter grid section below.
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug, descripcion, imagen_url, imagen_config')
    .eq('activo', true)
    .order('orden')

  // All chapters for all courses — single query, group client-side
  const cursoIds = (cursos || []).map((c) => c.id)
  const { data: capitulos } = cursoIds.length
    ? await supabase
        .from('capitulos')
        .select('id, curso_id, numero, nombre, imagen_url')
        .in('curso_id', cursoIds)
        .order('numero')
    : { data: [] }

  // First PDF per chapter so chapter cards link directly to the PDF viewer
  const { data: chapterPdfs } = cursoIds.length
    ? await supabase
        .from('contenido')
        .select('id, capitulo_id')
        .eq('tipo', 'pdf')
        .in('capitulo_id', (capitulos || []).map((c) => c.id))
        .order('orden')
    : { data: [] }

  // Map capituloId → first PDF contenido id
  const firstPdfByCapitulo = new Map<string, string>()
  for (const pdf of chapterPdfs || []) {
    if (!firstPdfByCapitulo.has(pdf.capitulo_id)) {
      firstPdfByCapitulo.set(pdf.capitulo_id, pdf.id)
    }
  }

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
      const pdfId = firstPdfByCapitulo.get(cap.id)
      return {
        id: cap.id,
        numero: cap.numero,
        nombre: cap.nombre,
        imagenUrl: (cap as typeof cap & { imagen_url?: string | null }).imagen_url ?? null,
        href: pdfId ? `/estudio/pdf/${pdfId}` : `/estudio`,
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

  // Build curso data with pre-computed cards for the client component
  const cursosConCards = cursosList.map((curso) => {
    const caps = chaptersByCurso.get(curso.id) ?? []
    return {
      id: curso.id,
      nombre: curso.nombre,
      slug: curso.slug,
      imagenUrl: (curso as typeof curso & { imagen_url?: string | null }).imagen_url ?? null,
      imagenConfig: (curso as typeof curso & { imagen_config?: unknown }).imagen_config ?? null,
      cards: makeCards(caps, curso.slug),
    }
  })

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Guía
      </h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        {cursosList.length === 0
          ? 'Los cursos se están preparando.'
          : cursosList.length > 1
            ? `${cursosList.length} cursos activos`
            : cursosList[0].nombre}
      </p>

      {/* Empty state */}
      {cursosList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los cursos se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      ) : (
        <CursoPicker cursos={cursosConCards} isAdmin={isAdmin} />
      )}
    </div>
  )
}
