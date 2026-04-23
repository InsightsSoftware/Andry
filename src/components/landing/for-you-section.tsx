'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const CARDS = [
  {
    src: '/landing/contractor-working.jpg',
    alt: 'Contratista eléctrico hispano trabajando en una obra en Florida',
    tag: 'En la obra',
    title: 'El que mejor sabe construir',
    desc: 'Sabés instalar, cablear, inspeccionar. Tenés años de oficio en las manos — lo que te falta es pasar el papel del examen.',
    kenBurnsVariant: 'ken-burns-a' as const,
  },
  {
    src: '/landing/contractor-studying.jpg',
    alt: 'Contratista hispano estudiando desde su celular después del trabajo',
    tag: 'En tu tiempo',
    title: 'Estudiá donde y cuando puedas',
    desc: 'Mobile-first pensado para el obrero que labura todo el día. Manejando, en el break de la obra, o en casa después de la jornada.',
    kenBurnsVariant: 'ken-burns-b' as const,
  },
]

export function ForYouSection() {
  const gridRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Respect reduced motion — reveal immediately, skip animations
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setVisible(true)
      return
    }

    const node = gridRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -80px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Pensado para el{' '}
            <span className="text-gold">contratista hispano</span>
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-600 dark:text-neutral-400">
            Construís de verdad. Ahora necesitás una plataforma que respete tu tiempo
            y tu forma de aprender — en español, en tu celular, a tu ritmo.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-5 sm:grid-cols-2">
          {CARDS.map((c, i) => (
            <article
              key={c.tag}
              className={cn(
                'group relative overflow-hidden rounded-2xl glass-card cursor-default',
                'transition-all ease-out will-change-transform',
                visible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              )}
              style={{
                transitionDuration: '800ms',
                transitionDelay: visible ? `${i * 140}ms` : '0ms',
              }}
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={c.src}
                  alt={c.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
                  className={cn(
                    'object-cover',
                    // Continuous Ken Burns — slow zoom + pan, pauses on card hover
                    c.kenBurnsVariant,
                    'group-hover:[animation-play-state:paused] group-hover:scale-[1.04] transition-transform duration-700'
                  )}
                  priority={i === 0}
                />
                {/* Dark gradient overlay for copy contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-transparent pointer-events-none" />
                {/* Subtle purple + gold shimmer on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
                {/* Tag pill */}
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/15">
                  {c.tag}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-sm text-white/85 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
