'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'

interface Tilt3DProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  scale?: number
}

export function Tilt3D({
  children,
  className = '',
  maxTilt = 18,
  scale = 1.04,
}: Tilt3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')
  const [isHovering, setIsHovering] = useState(false)
  const rafRef = useRef<number>(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        const el = containerRef.current
        if (!el) return

        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const ratioX = (e.clientX - centerX) / (rect.width / 2)
        const ratioY = (e.clientY - centerY) / (rect.height / 2)

        const tiltX = -ratioY * maxTilt
        const tiltY = ratioX * maxTilt

        setTransform(
          `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`
        )
      })
    },
    [maxTilt, scale]
  )

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsHovering(false)
    setTransform('')
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transformStyle: 'preserve-3d',
        transform,
        transition: isHovering
          ? 'transform 0.1s ease-out'
          : 'transform 0.5s ease-out',
        willChange: 'transform',
      }}
    >
      <div className="relative z-[1]" style={{ transform: 'translateZ(40px)' }}>
        {children}
      </div>
    </div>
  )
}
