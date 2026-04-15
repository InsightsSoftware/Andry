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
  useEffect(() => {
    // Only activate on touch devices without a mouse
    const isTouchDevice = 'ontouchstart' in window && window.matchMedia('(pointer: coarse)').matches
    if (!isTouchDevice) return

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0   // front-to-back tilt (-180 to 180)
      const gamma = e.gamma ?? 0 // left-to-right tilt (-90 to 90)

      // Normalize: beta rests around 45-60 when holding phone, gamma rests at 0
      // Map to -1..1 range, clamped
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
      const normalizedBeta = clamp((beta - 45) / 30, -1, 1)  // 15-75 deg range
      const normalizedGamma = clamp(gamma / 30, -1, 1)       // -30 to 30 deg range

      const tiltX = -normalizedBeta * maxTilt
      const tiltY = normalizedGamma * maxTilt

      setTransform(
        `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`
      )
    }

    // iOS 13+ requires permission
    const requestPermission = async () => {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof DOE.requestPermission === 'function') {
        try {
          const permission = await DOE.requestPermission()
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
            setGyroActive(true)
          }
        } catch {
          // Permission denied — no gyro tilt
        }
      } else {
        // Android / non-iOS — no permission needed
        window.addEventListener('deviceorientation', handleOrientation)
        setGyroActive(true)
      }
    }

    requestPermission()

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [maxTilt, scale])

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
