'use client'

import { useEffect, useRef } from 'react'

/**
 * Scroll-driven parallax background for the hero.
 * 3 orb layers move at different speeds to create depth.
 */
export function HeroParallaxBg() {
  const layer1Ref = useRef<HTMLDivElement>(null)
  const layer2Ref = useRef<HTMLDivElement>(null)
  const layer3Ref = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY
        // Only animate while the hero is in view
        if (y > 1200) return
        if (layer1Ref.current)
          layer1Ref.current.style.transform = `translate3d(0, ${y * 0.25}px, 0)`
        if (layer2Ref.current)
          layer2Ref.current.style.transform = `translate3d(0, ${y * 0.45}px, 0)`
        if (layer3Ref.current)
          layer3Ref.current.style.transform = `translate3d(0, ${y * 0.6}px, 0)`
        if (gridRef.current)
          gridRef.current.style.transform = `translate3d(0, ${y * 0.15}px, 0)`
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Deep ambient orbs — slowest layer */}
      <div
        ref={layer1Ref}
        className="absolute top-[-15%] left-[5%] h-[600px] w-[600px] rounded-full bg-primary-600/20 blur-[150px]"
        style={{ willChange: 'transform' }}
      />
      {/* Gold accent — medium speed */}
      <div
        ref={layer2Ref}
        className="absolute bottom-[-10%] right-[0%] h-[500px] w-[500px] rounded-full bg-accent-500/15 blur-[130px]"
        style={{ willChange: 'transform' }}
      />
      {/* Front purple — fastest */}
      <div
        ref={layer3Ref}
        className="absolute top-[20%] right-[15%] h-[350px] w-[350px] rounded-full bg-primary-500/15 blur-[100px]"
        style={{ willChange: 'transform' }}
      />
      {/* Subtle grid overlay */}
      <div
        ref={gridRef}
        className="absolute inset-0 bg-[radial-gradient(rgba(147,51,234,0.06)_1px,transparent_1px)] opacity-40 [background-size:40px_40px]"
        style={{ willChange: 'transform' }}
      />
      {/* Bottom vignette for dark luxury depth */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/80 to-transparent dark:from-neutral-950/90" />
    </div>
  )
}
