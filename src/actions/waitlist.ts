'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresá un correo válido'),
})

export type WaitlistResult = { ok: true } | { error: string }

/**
 * Anota un correo en la lista de espera (cuando los cupos están agotados).
 * Usa el admin client (service role) porque lo llama un visitante anónimo.
 */
export async function joinWaitlist(email: string): Promise<WaitlistResult> {
  const parsed = waitlistSchema.safeParse({ email })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('lista_espera')
      .insert({ email: parsed.data.email.toLowerCase().trim() })

    if (error) {
      // 23505 = unique violation → el correo ya estaba anotado: lo tratamos como éxito.
      if (error.code === '23505') return { ok: true }
      console.error('[joinWaitlist] insert error:', error)
      return { error: 'No se pudo guardar. Intentá de nuevo en un momento.' }
    }
    return { ok: true }
  } catch (err) {
    console.error('[joinWaitlist] error:', err)
    return { error: 'No se pudo guardar. Intentá de nuevo en un momento.' }
  }
}
