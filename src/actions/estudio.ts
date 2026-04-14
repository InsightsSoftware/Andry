'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProgress(
  contenidoId: string,
  porcentaje: number,
  posicion?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const completado = porcentaje >= 95

  const { error } = await supabase.from('progreso_estudio').upsert(
    {
      user_id: user.id,
      contenido_id: contenidoId,
      progreso_porcentaje: Math.min(100, Math.round(porcentaje * 100) / 100),
      ultima_posicion: posicion || null,
      completado,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,contenido_id' }
  )

  if (error) {
    console.error('Error updating progress:', error)
    return { error: 'Error al guardar progreso' }
  }

  return { success: true, completado }
}
