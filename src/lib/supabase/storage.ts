import type { SupabaseClient } from '@supabase/supabase-js'

export const CONTENIDO_BUCKET = 'contenido-cursos'

/**
 * Given either a legacy public URL or a storage path, returns a short-lived
 * signed URL for the content bucket.
 *
 * We accept URLs as input too for backwards compatibility — records written
 * before the bucket was made private still hold the full public URL in
 * `contenido.archivo_url`. New uploads store just the path.
 */
export async function getSignedContentUrl(
  supabase: SupabaseClient,
  urlOrPath: string,
  ttlSeconds = 3600
): Promise<string> {
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
