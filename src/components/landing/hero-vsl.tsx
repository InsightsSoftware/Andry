'use client'

import { useRef } from 'react'

interface Props {
  src: string
  /** Imagen de respaldo (fallback) mientras el video no renderizó el frame.
   *  En la mayoría de navegadores se reemplaza por el frame real del seg 5. */
  poster: string
}

/**
 * Reproductor del VSL del hero.
 *
 * En vez de una imagen de portada de baja resolución, mostramos el propio
 * frame del video (nítido, 720p): al cargar la metadata hacemos seek al
 * segundo 5 y el navegador pinta ese frame como portada. En el primer play
 * reiniciamos a 0 para que el video arranque desde el principio.
 *
 * El `poster` queda como respaldo: se ve mientras el video no tiene frame
 * (y en iOS, que a veces no renderiza el seek hasta el primer toque).
 */
export function HeroVsl({ src, poster }: Props) {
  const startedRef = useRef(false)

  return (
    <video
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      onLoadedMetadata={(e) => {
        if (!startedRef.current) {
          try {
            e.currentTarget.currentTime = 5
          } catch {
            /* seek no disponible aún — se queda el poster de respaldo */
          }
        }
      }}
      onPlay={(e) => {
        if (!startedRef.current) {
          startedRef.current = true
          e.currentTarget.currentTime = 0
        }
      }}
      className="h-full w-full"
    >
      Tu navegador no soporta la reproducción de video.
    </video>
  )
}
