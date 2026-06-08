import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cap de ventas del lanzamiento. Cuando la cantidad de usuarios con
 * suscripción activa llega a este número, la landing bloquea los botones
 * de compra Y el endpoint /api/checkout rechaza crear nuevas sesiones de pago.
 *
 * Fuente única de verdad: lo usan tanto la landing como el checkout, así
 * nunca se desincronizan.
 *
 * ⚠️ Para vender las 100 guías reales, subir este número (y conviene borrar
 * los usuarios de testing antes, para no arrancar con el cupo casi lleno).
 */
export const CUPOS_LIMITE = 9

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
