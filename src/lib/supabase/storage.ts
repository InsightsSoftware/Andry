import type { SupabaseClient } from '@supabase/supabase-js'

export const CONTENIDO_BUCKET = 'contenido-cursos'

/**
 * Returns a SIGNED URL the browser can hit to fetch content from the bucket.
 *
 * El bucket es PRIVADO. Solo users con `profiles.subscription_status = 'active'`
 * y `subscription_expires_at > now()` (o admins/mentores) pueden generar URLs
 * via la storage policy. Si la policy rechaza, `createSignedUrl` devuelve un
 * error y este helper tira `Error("…subscription required…")`.
 *
 * El TTL corto (5 min default) limita el daño si un URL se filtra: aunque un
 * usuario lo comparta en WhatsApp, el link expira rápido.
 *
 * Acepta tres tipos de input:
 * 1. Path crudo (e.g. "negocios-y-finanzas/abc/audio_123.mp3")
 * 2. URL pública/firmada de Supabase → extraemos el path y re-firmamos.
 * 3. URL externa (ej: test data) → la devolvemos sin tocar.
 */
export async function getSignedContentUrl(
  supabase: SupabaseClient,
  urlOrPath: string,
  ttlSeconds = 300 // 5 minutos por default — corto a propósito
): Promise<string> {
  // External URL — not ours, hand it back as-is.
  if (isExternalUrl(urlOrPath)) {
    return urlOrPath
  }

  const path = extractPath(urlOrPath)
  const { data, error } = await supabase.storage
    .from(CONTENIDO_BUCKET)
    .createSignedUrl(path, ttlSeconds)

  if (error || !data?.signedUrl) {
    // Si la policy de storage rechaza, llegamos acá. Probable causa: el
    // user no tiene subscription activa, o no está logueado.
    throw new Error(
      `No se pudo firmar URL para "${path}": ${error?.message ?? 'sin signedUrl'}`
    )
  }

  return data.signedUrl
}

/**
 * Is this URL pointing to a non-Supabase host? (Typically test/dev data
 * that was seeded with external links.)
 */
export function isExternalUrl(urlOrPath: string): boolean {
  if (!urlOrPath.startsWith('http')) return false
  try {
    const u = new URL(urlOrPath)
    // Supabase URLs have the path marker for storage objects. Anything else
    // that's http(s) is external.
    return !u.pathname.includes('/storage/v1/object/')
  } catch {
    return false
  }
}

/**
 * Extract the storage path from either a full Supabase public URL, a signed
 * URL (with token), or a raw path. Returns the path without leading slash.
 */
export function extractPath(urlOrPath: string): string {
  // Already a bare path — no protocol, no bucket prefix
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath.replace(/^\/+/, '')
  }

  // Public URL pattern: /storage/v1/object/public/<bucket>/<path>
  const publicMatch = urlOrPath.match(
    /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/
  )
  if (publicMatch) return publicMatch[1]

  // Signed URL pattern: /storage/v1/object/sign/<bucket>/<path>?token=...
  const signedMatch = urlOrPath.match(
    /\/storage\/v1\/object\/sign\/[^/]+\/([^?]+)/
  )
  if (signedMatch) return signedMatch[1]

  // Fallback: assume the whole URL is a path (shouldn't happen)
  return urlOrPath
}
