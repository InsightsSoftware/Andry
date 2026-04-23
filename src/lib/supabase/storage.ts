import type { SupabaseClient } from '@supabase/supabase-js'

export const CONTENIDO_BUCKET = 'contenido-cursos'

/**
 * Returns a URL the browser can hit to fetch content from the bucket.
 *
 * The bucket is configured `public: true` (per migration 00010) — auth is
 * enforced at the app level (middleware + subscription gate), not at the
 * storage level. So we just return the public URL directly; no RLS dance,
 * no TTL, no "Object not found" errors from `createSignedUrl` hitting
 * storage.objects RLS.
 *
 * Accepts three kinds of input:
 * 1. A bare storage path (e.g. "negocios-y-finanzas/abc/audio_123.mp3")
 * 2. A Supabase public/signed URL → the path is extracted and re-wrapped.
 * 3. An external URL (e.g. test data on soundhelix.com) → returned as-is.
 *
 * Name kept as `getSignedContentUrl` for callsite compatibility; the
 * `ttlSeconds` param is now unused but accepted so existing callers
 * don't need to change.
 */
export async function getSignedContentUrl(
  supabase: SupabaseClient,
  urlOrPath: string,
  _ttlSeconds = 3600
): Promise<string> {
  // External URL — not ours, hand it back as-is.
  if (isExternalUrl(urlOrPath)) {
    return urlOrPath
  }

  const path = extractPath(urlOrPath)
  const { data } = supabase.storage.from(CONTENIDO_BUCKET).getPublicUrl(path)

  if (!data?.publicUrl) {
    throw new Error(`No se pudo construir URL pública para "${path}"`)
  }

  return data.publicUrl
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
