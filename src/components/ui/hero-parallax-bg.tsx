'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { BookOpen, CheckCircle } from 'lucide-react'

/**
 * Scroll-driven parallax background for the hero.
 * Abstract orb layers + real contractor images at different depths.
 */
export function HeroParallaxBg() {
  const layer1Ref = useRef<HTMLDivElement>(null)
  const layer2Ref = useRef<HTMLDivElement>(null)
  const layer3Ref = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  // Image parallax refs — different speeds for depth
  const imgLeftRef = useRef<HTMLDivElement>(null)
  const imgRightRef = useRef<HTMLDivElement>(null)
  const imgLeftBadgeRef = useRef<HTMLDivElement>(null)
  const imgRightBadgeRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY
        if (y > 1200) return

        // Abstract orb layers
        if (layer1Ref.current)
          layer1Ref.current.style.transform = `translate3d(0, ${y * 0.25}px, 0)`
        if (layer2Ref.current)
          layer2Ref.current.style.transform = `translate3d(0, ${y * 0.45}px, 0)`
        if (layer3Ref.current)
          layer3Ref.current.style.transform = `translate3d(0, ${y * 0.6}px, 0)`
        if (gridRef.current)
          gridRef.current.style.transform = `translate3d(0, ${y * 0.15}px, 0)`

        // Image cards — deeper parallax for foreground feel
        if (imgLeftRef.current)
          imgLeftRef.current.style.transform = `translate3d(0, ${y * 0.38}px, 0) rotate(-4deg)`
        if (imgRightRef.current)
          imgRightRef.current.style.transform = `translate3d(0, ${y * 0.28}px, 0) rotate(3.5deg)`

        // Floating badges drift slightly faster
        if (imgLeftBadgeRef.current)
          imgLeftBadgeRef.current.style.transform = `translate3d(0, ${y * 0.55}px, 0)`
        if (imgRightBadgeRef.current)
          imgRightBadgeRef.current.style.transform = `translate3d(0, ${y * 0.5}px, 0)`
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* ── Abstract orb layers ── */}
      <div
        ref={layer1Ref}
        className="absolute top-[-15%] left-[5%] h-[600px] w-[600px] rounded-full bg-primary-600/20 blur-[150px]"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={layer2Ref}
        className="absolute bottom-[-10%] right-[0%] h-[500px] w-[500px] rounded-full bg-accent-500/15 blur-[130px]"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={layer3Ref}
        className="absolute top-[20%] right-[15%] h-[350px] w-[350px] rounded-full bg-primary-500/15 blur-[100px]"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={gridRef}
        className="absolute inset-0 bg-[radial-gradient(rgba(147,51,234,0.06)_1px,transparent_1px)] opacity-40 [background-size:40px_40px]"
        style={{ willChange: 'transform' }}
      />

      {/* ── Left image card — contractor studying ── */}
      <div
        ref={imgLeftRef}
        className="absolute hidden xl:block"
        style={{
          top: '8%',
          left: '-2%',
          willChange: 'transform',
          transform: 'rotate(-4deg)',
        }}
      >
        <div className="relative w-[220px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
          {/* Purple glow behind card */}
          <div className="absolute -inset-3 rounded-3xl bg-primary-600/30 blur-xl -z-10" />
          <Image
            src="/landing/contractor-studying.jpg"
            alt="Contratista estudiando para el examen"
            width={220}
            height={280}
            className="object-cover"
            style={{ height: '280px' }}
            priority
          />
          {/* Gradient overlay for luxury feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
          {/* Label */}
          <div className="absolute bottom-3 left-3 right-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
              Estudiando a su ritmo
            </span>
          </div>
        </div>

        {/* Floating badge — drifts independently */}
        <div
          ref={imgLeftBadgeRef}
          className="absolute -bottom-6 -right-8"
          style={{ willChange: 'transform' }}
        >
          <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/20 shadow-lg">
            <p className="text-[11px] font-semibold text-white flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary-300" /> PDF Interactivo</p>
            <p className="text-[10px] text-neutral-400">Búsqueda + notas</p>
          </div>
        </div>
      </div>

      {/* ── Right image card — contractor working ── */}
      <div
        ref={imgRightRef}
        className="absolute hidden xl:block"
        style={{
          top: '12%',
          right: '-1%',
          willChange: 'transform',
          transform: 'rotate(3.5deg)',
        }}
      >
        <div className="relative w-[210px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
          {/* Gold glow behind card */}
          <div className="absolute -inset-3 rounded-3xl bg-accent-500/25 blur-xl -z-10" />
          <Image
            src="/landing/contractor-working.jpg"
            alt="Contratista en el trabajo"
            width={210}
            height={265}
            className="object-cover"
            style={{ height: '265px' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
              Listo para la licencia
            </span>
          </div>
        </div>

        {/* Floating badge */}
        <div
          ref={imgRightBadgeRef}
          className="absolute -bottom-6 -left-8"
          style={{ willChange: 'transform' }}
        >
          <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/20 shadow-lg">
            <p className="text-[11px] font-semibold text-white flex items-center gap-1"><CheckCircle className="h-3 w-3 text-accent-400" /> Aprobaron</p>
            <p className="text-[10px] text-neutral-400">+200 contratistas</p>
          </div>
        </div>
      </div>

      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/80 to-transparent dark:from-neutral-950/90" />
    </div>
  )
}
