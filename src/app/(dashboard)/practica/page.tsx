import { createClient } from '@/lib/supabase/server'
import { PracticaLanding } from '@/components/practica/practica-landing'

export const metadata = { title: 'Práctica y Examen' }

export default async function PracticaIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const errorCode = params.error ?? null
  const supabase = await createClient()

  // Load active courses
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('orden')

  // Load chapters + question count per chapter
  const cursosConCapitulos = await Promise.all(
    (cursos || []).map(async (curso) => {
      const { data: capitulos } = await supabase
        .from('capitulos')
        .select('id, nombre, numero')
        .eq('curso_id', curso.id)
        .order('numero')

      const capitulosConPreguntas = await Promise.all(
        (capitulos || []).map(async (cap) => {
          const { count } = await supabase
            .from('preguntas')
            .select('id', { count: 'exact', head: true })
            .eq('capitulo_id', cap.id)
          return { ...cap, questionCount: count || 0 }
        })
      )

      return { ...curso, capitulos: capitulosConPreguntas }
    })
  )

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-neutral-900 dark:text-white">
        Práctica y Examen
      </h1>
      <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        Elegí el modo que mejor se adapta a tu sesión de hoy
      </p>

      <PracticaLanding cursosConCapitulos={cursosConCapitulos} errorCode={errorCode} />
    </div>
  )
}
