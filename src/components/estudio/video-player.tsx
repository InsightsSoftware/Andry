'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { updateProgress } from '@/actions/estudio'
import { CheckCircle2 } from 'lucide-react'
import { formatSeconds } from '@/lib/utils'

interface VideoPlayerProps {
  contenidoId: string
  archivoUrl: string
  initialProgress: number
  initialPosition: string
}

export function VideoPlayer({
  contenidoId,
  archivoUrl,
  initialProgress,
  initialPosition,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(initialProgress)
  const [completed, setCompleted] = useState(initialProgress >= 95)
  const [isPlaying, setIsPlaying] = useState(false)

  // Save progress every 15 seconds while playing
  const saveProgress = useCallback(async () => {
    if (!videoRef.current || !duration) return
    const pct = (videoRef.current.currentTime / duration) * 100
    const pos = videoRef.current.currentTime.toString()
    setProgress(pct)
    const result = await updateProgress(contenidoId, pct, pos)
    if (result?.completado) setCompleted(true)
  }, [contenidoId, duration])

  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(saveProgress, 15000)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [isPlaying, saveProgress])

  // Save progress on unmount
  useEffect(() => {
    return () => {
      saveProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      // Resume from last position
      const startPos = parseFloat(initialPosition) || 0
      if (startPos > 0 && startPos < videoRef.current.duration) {
        videoRef.current.currentTime = startPos
      }
    }
  }

  const handleEnded = async () => {
    setIsPlaying(false)
    await updateProgress(contenidoId, 100, duration.toString())
    setProgress(100)
    setCompleted(true)
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Completion badge */}
      {completed && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Completado</span>
        </div>
      )}

      {/* Video element with native controls */}
      <video
        ref={videoRef}
        src={archivoUrl}
        controls
        controlsList="nodownload"
        className="w-full aspect-video bg-black"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="metadata"
      />

      {/* Progress bar underneath */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Progreso de visualización
          </span>
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
