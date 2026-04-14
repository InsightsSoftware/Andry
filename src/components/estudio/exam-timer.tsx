'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { formatSeconds } from '@/lib/utils'

interface ExamTimerProps {
  tiempoLimiteSegundos: number
  onTimeUp: () => void
}

export function ExamTimer({ tiempoLimiteSegundos, onTimeUp }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(tiempoLimiteSegundos)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasTriggered = useRef(false)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        if (next <= 0 && !hasTriggered.current) {
          hasTriggered.current = true
          onTimeUp()
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tiempoLimiteSegundos, onTimeUp])

  const isLow = remaining <= 300 // 5 minutes
  const isCritical = remaining <= 60 // 1 minute

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
        isCritical
          ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 animate-pulse'
          : isLow
            ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      {formatSeconds(Math.max(0, remaining))}
    </div>
  )
}
