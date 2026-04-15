'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Tilt3D } from '@/components/ui/tilt-3d'

export function HeroLogo() {
  const [isHovering, setIsHovering] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window && window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const showGlow = isHovering || isTouchDevice

  return (
    <div className="mb-10 flex flex-col items-center">
      <div
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Core glow — outside Tilt3D, centered on logo */}
        <div className={`hero-core-glow ${showGlow ? 'hero-core-glow-visible' : ''}`} />

        <Tilt3D
          className="relative z-[2] cursor-pointer"
          maxTilt={20}
          scale={1.05}
        >
          <div className="hero-logo-container">
            <Image
              src="/logo.png"
              alt="Y Exam Prep"
              width={600}
              height={370}
              className="relative z-[1] h-auto w-[360px] sm:w-[460px] lg:w-[560px]"
              priority
            />
          </div>
        </Tilt3D>
      </div>
    </div>
  )
}
