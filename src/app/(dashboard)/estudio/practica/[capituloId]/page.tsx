import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeSession } from '@/components/estudio/practice-session'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ capituloId: string }>
}) {
  const { capituloId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('capitulos')
    .select('nombre')
    .eq('id', capituloId)
    .single()

  return { title: data ? `Práctica: ${data.nombre}` : 'Práctica' }
}

export default async function PracticaPage({
  params,
}: {
  params: Promise<{ capituloId: string }>
}) {
  const { capituloId } = await params
  const supabase = await createClient()

  // Fetch chapter with course info
  const { data: capitulo } = await supabase
    .from('capitulos')
    .select('*, cursos(id, slug, nombre)')
    .eq('id', capituloId)
    .single()

  if (!capitulo) notFound()

  // Fetch questions for this chapter
  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, texto, opcion_a, opcion_b, opcion_c, opcion_d')
    .eq('capitulo_id', capituloId)

  if (!preguntas || preguntas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Sin preguntas disponibles
        </p>
        <p className="text-neutral-500 dark:text-neutral-400">
          Aún no hay preguntas de práctica para este capítulo.
        </p>
      </div>
    )
  }

  // Shuffle questions
  const shuffled = [...preguntas].sort(() => Math.random() - 0.5).slice(0, 10)

  const curso = (capitulo as any).cursos
  const cursoId = curso?.id || ''
  const cursoSlug = curso?.slug || ''
  const cursoNombre = curso?.nombre || 'Curso'

  return (
    <PracticeSession
      capituloId={capituloId}
      capituloNombre={capitulo.nombre}
      cursoId={cursoId}
      cursoSlug={cursoSlug}
      cursoNombre={cursoNombre}
      preguntas={shuffled.map((p) => ({
        id: p.id,
        texto: p.texto,
        opciones: [
          { key: 'a' as const, text: p.opcion_a },
          { key: 'b' as const, text: p.opcion_b },
          { key: 'c' as const, text: p.opcion_c },
          { key: 'd' as const, text: p.opcion_d },
        ],
      }))}
    />
  )
}
