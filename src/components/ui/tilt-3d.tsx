'use client'

import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'

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
  const [gyroActive, setGyroActive] = useState(false)
  const rafRef = useRef<number>(0)

  // Desktop: mouse-based tilt
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

  // Mobile: gyroscope-based tilt
  const orientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const touch = 'ontouchstart' in window && window.matchMedia('(pointer: coarse)').matches
    setIsTouchDevice(touch)

    // Android: no permission needed, activate on mount
    if (touch) {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof DOE.requestPermission !== 'function') {
        // Android — start immediately
        const handler = (e: DeviceOrientationEvent) => {
          const beta = e.beta ?? 0
          const gamma = e.gamma ?? 0
          const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
          const normalizedBeta = clamp((beta - 45) / 30, -1, 1)
          const normalizedGamma = clamp(gamma / 30, -1, 1)
          setTransform(
            `perspective(800px) rotateX(${-normalizedBeta * maxTilt}deg) rotateY(${normalizedGamma * maxTilt}deg) scale3d(${scale}, ${scale}, ${scale})`
          )
        }
        window.addEventListener('deviceorientation', handler)
        orientationHandlerRef.current = handler
        setGyroActive(true)
      }
    }

    return () => {
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current)
      }
    }
  }, [maxTilt, scale])

  // iOS: request permission on first tap (Apple requires user gesture)
  const handleTouchStart = useCallback(async () => {
    if (gyroActive) return // Already active
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof DOE.requestPermission !== 'function') return // Not iOS

    try {
      const permission = await DOE.requestPermission()
      if (permission === 'granted') {
        const handler = (e: DeviceOrientationEvent) => {
          const beta = e.beta ?? 0
          const gamma = e.gamma ?? 0
          const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
          const normalizedBeta = clamp((beta - 45) / 30, -1, 1)
          const normalizedGamma = clamp(gamma / 30, -1, 1)
          setTransform(
            `perspective(800px) rotateX(${-normalizedBeta * maxTilt}deg) rotateY(${normalizedGamma * maxTilt}deg) scale3d(${scale}, ${scale}, ${scale})`
          )
        }
        window.addEventListener('deviceorientation', handler)
        orientationHandlerRef.current = handler
        setGyroActive(true)
      }
    } catch {
      // Permission denied
    }
  }, [gyroActive, maxTilt, scale])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={isTouchDevice ? handleTouchStart : undefined}
      className={className}
      style={{
        transformStyle: 'preserve-3d',
        transform,
        transition: isHovering || gyroActive
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
