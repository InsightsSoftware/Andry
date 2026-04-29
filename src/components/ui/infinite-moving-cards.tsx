'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Item {
  quote: string
  name: string
  title?: string
}

interface InfiniteMovingCardsProps {
  items: Item[]
  direction?: 'left' | 'right'
  speed?: 'fast' | 'normal' | 'slow'
  pauseOnHover?: boolean
  className?: string
}

export function InfiniteMovingCards({
  items,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLUListElement>(null)
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return

    // Duplicate items for seamless loop
    const scrollerContent = Array.from(scrollerRef.current.children)
    scrollerContent.forEach((item) => {
      const dup = item.cloneNode(true)
      scrollerRef.current?.appendChild(dup)
    })

    containerRef.current.style.setProperty(
      '--animation-direction',
      direction === 'left' ? 'forwards' : 'reverse'
    )
    containerRef.current.style.setProperty(
      '--animation-duration',
      speed === 'fast' ? '20s' : speed === 'normal' ? '40s' : '80s'
    )
    setStart(true)
  }, [direction, speed])

  return (
    <div
      ref={containerRef}
      className={cn(
        'scroller relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]',
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap',
          start && 'animate-scroll',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
      >
        {items.map((item, idx) => (
          <li
            key={idx}
            className="w-[280px] max-w-full relative rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-5 py-4 flex-shrink-0"
          >
            <blockquote>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="flex flex-col">
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{item.name}</span>
                {item.title && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.title}</span>
                )}
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  )
}
