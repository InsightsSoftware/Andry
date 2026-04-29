'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface FlipWordsProps {
  words: string[]
  duration?: number
  className?: string
}

export function FlipWords({ words, duration = 3000, className }: FlipWordsProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % words.length)
  }, [words.length])

  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(startAnimation, duration)
      return () => clearTimeout(timer)
    }
  }, [isAnimating, duration, startAnimation])

  return (
    <AnimatePresence
      onExitComplete={() => setIsAnimating(false)}
      mode="wait"
    >
      <motion.span
        key={words[currentIdx]}
        initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(8px)', scale: 1.05 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={() => setIsAnimating(false)}
        className={cn('inline-block', className)}
      >
        {words[currentIdx].split('').map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            className="inline-block"
          >
            {letter === ' ' ? ' ' : letter}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  )
}
