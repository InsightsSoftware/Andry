import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamRunner } from '@/components/estudio/exam-runner'

export const metadata = { title: 'Examen Simulación Real' }

export default async function ExamenPage({
  params,
}: {
  params: Promise<{ sesionId: string }>
}) {
  const { sesionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch session — scoped to current user
  const { data: sesion } = await supabase
    .from('sesiones_examen')
    .select('*, cursos(slug, nombre)')
    .eq('id', sesionId)
    .eq('user_id', user.id)
    .single()

  if (!sesion) notFound()

  // If already completed, redirect to results
  if (sesion.completado) {
    redirect(`/estudio/resultados/${sesionId}`)
  }

  // Get questions: either for a specific chapter or all chapters in the course
  const capituloFilter = sesion.capitulo_id
    ? { capitulo_id: sesion.capitulo_id }
    : null

  let preguntasQuery = supabase
    .from('preguntas')
    .select('id, texto, opcion_a, opcion_b, opcion_c, opcion_d, capitulo_id, imagen_url, opcion_a_imagen_url, opcion_b_imagen_url, opcion_c_imagen_url, opcion_d_imagen_url')

  if (capituloFilter) {
    preguntasQuery = preguntasQuery.eq('capitulo_id', capituloFilter.capitulo_id)
  } else {
    // Get all chapters for this course
    const { data: capitulos } = await supabase
      .from('capitulos')
      .select('id')
      .eq('curso_id', sesion.curso_id)

    if (capitulos?.length) {
      preguntasQuery = preguntasQuery.in(
        'capitulo_id',
        capitulos.map((c) => c.id)
      )
    }
  }

  const { data: preguntas } = await preguntasQuery.limit(sesion.total_preguntas)

  if (!preguntas?.length) notFound()

  // Get already answered questions
  const { data: respuestas } = await supabase
    .from('respuestas_usuario')
    .select('pregunta_id, respuesta_seleccionada')
    .eq('sesion_id', sesionId)

  const answeredMap = new Map(
    (respuestas || []).map((r) => [r.pregunta_id, r.respuesta_seleccionada])
  )

  // Always shuffle — both practice and exam modes should randomize question order
  const shuffled = [...preguntas].sort(() => Math.random() - 0.5)

  const cursoSlug = (sesion as any).cursos?.slug || ''

  return (
    <ExamRunner
      sesionId={sesionId}
      cursoSlug={cursoSlug}
      tiempoLimiteSegundos={sesion.tiempo_limite_segundos ?? 0}
      isPractica={sesion.tipo === 'practica'}
      preguntas={shuffled.map((p) => ({
        id: p.id,
        texto: p.texto,
        imagenUrl: (p as any).imagen_url ?? null,
        opciones: [
          { key: 'a' as const, text: p.opcion_a, imagenUrl: (p as any).opcion_a_imagen_url ?? null },
          { key: 'b' as const, text: p.opcion_b, imagenUrl: (p as any).opcion_b_imagen_url ?? null },
          { key: 'c' as const, text: p.opcion_c, imagenUrl: (p as any).opcion_c_imagen_url ?? null },
          { key: 'd' as const, text: p.opcion_d, imagenUrl: (p as any).opcion_d_imagen_url ?? null },
        ],
        answered: answeredMap.get(p.id) as 'a' | 'b' | 'c' | 'd' | null || null,
      }))}
    />
  )
}
