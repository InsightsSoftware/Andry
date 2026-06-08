import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cap de ventas del lanzamiento. Cuando la cantidad de usuarios con
 * suscripción activa llega a este número, la landing bloquea los botones
 * de compra Y el endpoint /api/checkout rechaza crear nuevas sesiones de pago.
 *
 * Fuente única de verdad: lo usan tanto la landing como el checkout, así
 * nunca se desincronizan.
 *
 * ⚠️ Los usuarios de testing también ocupan cupo. Si querés exactamente N
 * ventas reales, borrá los de testing o sumá su cantidad a este número.
 */
export const CUPOS_LIMITE = 110

/** Cuenta usuarios con suscripción activa (las ventas reales). */
export async function contarCuposVendidos(): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_status', 'activa')
  return count ?? 0
}

/**
 * True si ya se llegó al cap de ventas.
 *
 * Fail-open: si la consulta falla, devuelve false (NO bloquea) para no
 * frenar ventas por un error transitorio de la DB.
 */
export async function cuposAgotados(): Promise<boolean> {
  try {
    return (await contarCuposVendidos()) >= CUPOS_LIMITE
  } catch {
    return false
  }
}
