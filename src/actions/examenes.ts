'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Start a practice session for a specific chapter.
 * Selects up to 10 random questions from that chapter.
 */
export async function startPractice(capituloId: string, cursoId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  // Fetch random questions for this chapter
  const { data: preguntas, error: qError } = await supabase
    .from('preguntas')
    .select('id')
    .eq('capitulo_id', capituloId)
    .limit(10)

  if (qError || !preguntas?.length) {
    return { error: 'No hay preguntas disponibles para este capítulo' }
  }

  // Create practice session
  const { data: sesion, error: sError } = await supabase
    .from('sesiones_examen')
    .insert({
      user_id: user.id,
      tipo: 'practica',
      capitulo_id: capituloId,
      curso_id: cursoId,
      total_preguntas: preguntas.length,
      respuestas_correctas: 0,
      completado: false,
    })
    .select('id')
    .single()

  if (sError) {
    console.error('Error creating practice session:', sError)
    return { error: 'Error al crear sesión de práctica' }
  }

  return { success: true, sesionId: sesion.id }
}

/**
 * Start a timed exam session for a full course.
 * Selects up to 45 random questions from all chapters.
 * Time limit: 90 minutes (5400 seconds).
 */
export async function startExam(cursoId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  // Get all chapters for this course
  const { data: capitulos } = await supabase
    .from('capitulos')
    .select('id')
    .eq('curso_id', cursoId)

  if (!capitulos?.length) {
    return { error: 'No hay capítulos disponibles' }
  }

  const capIds = capitulos.map((c) => c.id)

  // Fetch random questions from all chapters
  const { data: preguntas, error: qError } = await supabase
    .from('preguntas')
    .select('id')
    .in('capitulo_id', capIds)
    .limit(45)

  if (qError || !preguntas?.length) {
    return { error: 'No hay preguntas disponibles para el examen' }
  }

  // Create exam session with time limit
  const { data: sesion, error: sError } = await supabase
    .from('sesiones_examen')
    .insert({
      user_id: user.id,
      tipo: 'examen',
      capitulo_id: null,
      curso_id: cursoId,
      total_preguntas: preguntas.length,
      respuestas_correctas: 0,
      tiempo_limite_segundos: 5400, // 90 minutes
      completado: false,
    })
    .select('id')
    .single()

  if (sError) {
    console.error('Error creating exam session:', sError)
    return { error: 'Error al crear sesión de examen' }
  }

  return { success: true, sesionId: sesion.id }
}

/**
 * Submit an answer for a question in a session.
 * Returns whether the answer was correct and the explanation.
 */
export async function submitAnswer(
  sesionId: string,
  preguntaId: string,
  respuesta: 'a' | 'b' | 'c' | 'd'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  // Verify session ownership (IDOR prevention)
  const { data: sesionOwner } = await supabase
    .from('sesiones_examen')
    .select('id')
    .eq('id', sesionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sesionOwner) return { error: 'Sesión no encontrada' }

  // Check if this answer already exists (use maybeSingle to avoid PGRST116)
  const { data: existing } = await supabase
    .from('respuestas_usuario')
    .select('id')
    .eq('sesion_id', sesionId)
    .eq('pregunta_id', preguntaId)
    .maybeSingle()

  if (existing) {
    // Already answered — fetch the question data to return feedback
    const { data: q } = await supabase
      .from('preguntas')
      .select('respuesta_correcta, explicacion, pagina_libro')
      .eq('id', preguntaId)
      .maybeSingle()

    if (q) {
      return {
        success: true,
        esCorrecta: respuesta === q.respuesta_correcta,
        respuestaCorrecta: q.respuesta_correcta,
        explicacion: q.explicacion,
        paginaLibro: q.pagina_libro,
      }
    }
    return { error: 'Ya respondiste esta pregunta' }
  }

  // Get the correct answer
  const { data: pregunta, error: pError } = await supabase
    .from('preguntas')
    .select('respuesta_correcta, explicacion, pagina_libro')
    .eq('id', preguntaId)
    .maybeSingle()

  if (pError || !pregunta) {
    console.error('Error fetching question:', pError)
    return { error: 'Pregunta no encontrada' }
  }

  const esCorrecta = respuesta === pregunta.respuesta_correcta

  // Insert the answer
  const { error: aError } = await supabase.from('respuestas_usuario').insert({
    sesion_id: sesionId,
    pregunta_id: preguntaId,
    respuesta_seleccionada: respuesta,
    es_correcta: esCorrecta,
  })

  if (aError) {
    console.error('Error saving answer:', aError)
    return { error: 'Error al guardar respuesta' }
  }

  // Update session score if correct
  if (esCorrecta) {
    const { data: sesion } = await supabase
      .from('sesiones_examen')
      .select('respuestas_correctas')
      .eq('id', sesionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (sesion) {
      await supabase
        .from('sesiones_examen')
        .update({ respuestas_correctas: sesion.respuestas_correctas + 1 })
        .eq('id', sesionId)
        .eq('user_id', user.id)
    }
  }

  return {
    success: true,
    esCorrecta,
    respuestaCorrecta: pregunta.respuesta_correcta,
    explicacion: pregunta.explicacion,
    paginaLibro: pregunta.pagina_libro,
  }
}

/**
 * Finish a session — mark as completed, record time used.
 */
export async function finishSession(
  sesionId: string,
  tiempoUsadoSegundos?: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('sesiones_examen')
    .update({
      completado: true,
      finalizado_at: new Date().toISOString(),
      ...(tiempoUsadoSegundos !== undefined && {
        tiempo_usado_segundos: tiempoUsadoSegundos,
      }),
    })
    .eq('id', sesionId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error finishing session:', error)
    return { error: 'Error al finalizar sesión' }
  }

  revalidatePath('/estudio')
  return { success: true }
}
