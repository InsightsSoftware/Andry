'use client'

import { motion } from 'motion/react'

interface SpotlightProps {
  gradientFirst?: string
  gradientSecond?: string
  gradientThird?: string
  translateY?: number
  width?: number
  height?: number
  smallWidth?: number
  duration?: number
  xOffset?: number
}

export function Spotlight({
  gradientFirst = 'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(270, 80%, 70%, .12) 0, hsla(270, 80%, 55%, .04) 50%, hsla(270, 80%, 45%, 0) 80%)',
  gradientSecond = 'radial-gradient(50% 50% at 50% 50%, hsla(270, 80%, 70%, .08) 0, hsla(270, 80%, 55%, .02) 80%, transparent 100%)',
  gradientThird = 'radial-gradient(50% 50% at 50% 50%, hsla(43, 70%, 60%, .07) 0, hsla(43, 70%, 50%, .02) 80%, transparent 100%)',
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}: SpotlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Left beam */}
      <motion.div
        animate={{ x: [0, xOffset, 0] }}
        transition={{ duration, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        className="absolute left-0 top-0"
        style={{ translateY }}
      >
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            background: gradientFirst,
            transform: 'rotate(-45deg)',
            transformOrigin: 'top left',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: `${smallWidth}px`,
            height: `${height}px`,
            background: gradientSecond,
            transform: 'rotate(-45deg)',
            transformOrigin: 'top left',
          }}
        />
      </motion.div>

      {/* Right beam */}
      <motion.div
        animate={{ x: [0, -xOffset, 0] }}
        transition={{ duration, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: duration / 2 }}
        className="absolute right-0 top-0"
        style={{ translateY }}
      >
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            background: gradientFirst,
            transform: 'rotate(45deg)',
            transformOrigin: 'top right',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: '50%',
            width: `${smallWidth}px`,
            height: `${height}px`,
            background: gradientThird,
            transform: 'rotate(45deg)',
            transformOrigin: 'top right',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
