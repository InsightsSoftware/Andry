'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface HeroVideoProps {
  /** MP4 video path under /public */
  src: string
  /** Poster image shown before/while the video loads. Also used as the
   *  full fallback when prefers-reduced-motion is set. */
  poster: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}

/**
 * Auto-playing, muted, looped hero video with:
 * - a Next.js `<Image>` poster underneath so users see something instantly
 * - `prefers-reduced-motion` honored — users with reduced motion get the
 *   static image and the video is never loaded
 * - `playsInline` + `muted` for iOS/Safari autoplay compliance
 */
export function HeroVideo({
  src,
  poster,
  alt,
  width,
  height,
  className = '',
  priority = false,
}: HeroVideoProps) {
  const [reduced, setReduced] = useState(false)
  const [ready, setReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Poster image — always visible underneath until the video fades in */}
      <Image
        src={poster}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Video layer — fades in once metadata loads. Skipped entirely for
          reduced-motion users. */}
      {!reduced && (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
