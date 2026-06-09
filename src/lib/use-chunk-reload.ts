'use client'

import { useEffect } from 'react'

/**
 * Maneja el "ChunkLoadError" de Next.js.
 *
 * Pasa cuando se hace un deploy nuevo: Next genera chunks de JS con hashes
 * nuevos y borra los viejos. Si el usuario tenía la app abierta (versión vieja)
 * y navega a una página que carga un chunk lazy, el navegador pide un chunk que
 * ya no existe → falla la carga.
 *
 * Solución: recargar la página una sola vez para traer la versión nueva. El
 * freno por timestamp en sessionStorage evita un bucle de recargas si el chunk
 * sigue fallando por otra razón (ahí se muestra el error normal).
 */
export function useChunkReloadOnError(error: (Error & { digest?: string }) | null | undefined) {
  useEffect(() => {
    if (!error) return
    const msg = error.message || ''
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      /loading chunk|failed to load chunk|error loading dynamically imported module/i.test(msg)
    if (!isChunkError) return

    const KEY = 'yxp:chunk-reload-at'
    let last = 0
    try {
      last = Number(sessionStorage.getItem(KEY) || '0')
    } catch {
      /* sessionStorage no disponible */
    }
    // Solo recargar si el último auto-reload fue hace más de 10s (evita bucle).
    if (Date.now() - last > 10_000) {
      try {
        sessionStorage.setItem(KEY, String(Date.now()))
      } catch {
        /* ignore */
      }
      window.location.reload()
    }
  }, [error])
}
