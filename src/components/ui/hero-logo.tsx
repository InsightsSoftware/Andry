'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Tilt3D } from '@/components/ui/tilt-3d'

export function HeroLogo() {
  const [isHovering, setIsHovering] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window &&
        window.matchMedia('(pointer: coarse)').matches
    )
  }, [])

  const showGlow = isHovering || isTouchDevice

  return (
    <div className="mb-10 flex flex-col items-center">
      <div
        className="hero-logo-float relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Floor light pool — metallic reflection under the logo */}
        <div className="hero-logo-floor" aria-hidden />

        {/* Ambient core glow — purple + gold radial, sits behind the logo */}
        <div
          className={`hero-core-glow ${showGlow ? 'hero-core-glow-visible' : ''}`}
        />

        {/* Idle glow — always visible, subtle, for the "always on" luxury feel */}
        <div className="hero-idle-glow" />

        <Tilt3D
          className="relative z-[2] cursor-pointer"
          maxTilt={20}
          scale={1.05}
        >
          <div className="hero-logo-container">
            {/* Dark mode — gold logo */}
            <Image
              src="/logo.png"
              alt="Y Exam Prep"
              width={600}
              height={600}
              className="hero-logo-img relative z-[1] h-auto w-[280px] sm:w-[340px] lg:w-[380px] hidden dark:block"
              priority
            />
            {/* Light mode — morado logo */}
            <Image
              src="/logo-light.png"
              alt="Y Exam Prep"
              width={600}
              height={600}
              className="hero-logo-img relative z-[1] h-auto w-[280px] sm:w-[340px] lg:w-[380px] block dark:hidden"
              priority
            />

            {/* Metallic shine sweep — clipped to logo silhouette */}
            <div className="hero-shine-sweep" aria-hidden />
          </div>
        </Tilt3D>
      </div>
    </div>
  )
}
