import type { SupabaseClient } from '@supabase/supabase-js'

export const CONTENIDO_BUCKET = 'contenido-cursos'

/**
 * Given either a legacy public URL or a storage path, returns a short-lived
 * signed URL for the content bucket.
 *
 * Accepts three kinds of input:
 * 1. A bare storage path (e.g. "negocios-finanzas/abc/audio_123.mp3") — signed.
 * 2. A Supabase public/signed URL → the path is extracted and re-signed.
 * 3. An external URL (e.g. test data on soundhelix.com) → returned as-is,
 *    since there's nothing for us to sign.
 */
export async function getSignedContentUrl(
  supabase: SupabaseClient,
  urlOrPath: string,
  ttlSeconds = 3600
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
    throw new Error(
      `No se pudo generar URL firmada para "${path}": ${error?.message || 'error desconocido'}`
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
