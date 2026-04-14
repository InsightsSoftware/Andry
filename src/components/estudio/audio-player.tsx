'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { updateProgress } from '@/actions/estudio'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  CheckCircle2,
  Headphones,
  Gauge,
} from 'lucide-react'
import { formatSeconds } from '@/lib/utils'

interface AudioPlayerProps {
  contenidoId: string
  archivoUrl: string
  titulo: string
  descripcion: string | null
  duracionSegundos: number | null
  initialProgress: number
  initialPosition: string
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]

export function AudioPlayer({
  contenidoId,
  archivoUrl,
  titulo,
  duracionSegundos,
  initialProgress,
  initialPosition,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(parseFloat(initialPosition) || 0)
  const [duration, setDuration] = useState(duracionSegundos || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [completed, setCompleted] = useState(initialProgress >= 95)
  const [progress, setProgress] = useState(initialProgress)

  // Save progress every 15 seconds while playing
  const saveProgress = useCallback(async () => {
    if (!audioRef.current || !duration) return
    const pct = (audioRef.current.currentTime / duration) * 100
    const pos = audioRef.current.currentTime.toString()
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
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      // Resume from last position
      const startPos = parseFloat(initialPosition) || 0
      if (startPos > 0 && startPos < audioRef.current.duration) {
        audioRef.current.currentTime = startPos
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = async () => {
    setIsPlaying(false)
    await updateProgress(contenidoId, 100, duration.toString())
    setProgress(100)
    setCompleted(true)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, audioRef.current.currentTime + seconds)
    )
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const time = parseFloat(e.target.value)
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const vol = parseFloat(e.target.value)
    audioRef.current.volume = vol
    setVolume(vol)
    if (vol === 0) setIsMuted(true)
    else setIsMuted(false)
  }

  const cyclePlaybackRate = () => {
    if (!audioRef.current) return
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length
    const newRate = PLAYBACK_RATES[nextIndex]
    audioRef.current.playbackRate = newRate
    setPlaybackRate(newRate)
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      <audio
        ref={audioRef}
        src={archivoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Album art / visual */}
      <div className="mb-5 flex items-center justify-center">
        <div
          className={`flex h-32 w-32 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
        >
          <Headphones className="h-16 w-16 text-primary-600 dark:text-primary-400" />
        </div>
      </div>

      {/* Title */}
      <h2 className="mb-1 text-center font-bold text-neutral-900 dark:text-neutral-100">
        {titulo}
      </h2>
      {completed && (
        <div className="mb-3 flex items-center justify-center gap-1 text-success-600 dark:text-success-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Completado</span>
        </div>
      )}

      {/* Seek bar */}
      <div className="mb-2 mt-4">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 rounded-full appearance-none bg-neutral-200 dark:bg-neutral-700 cursor-pointer accent-primary-600"
        />
        <div className="mt-1 flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
          <span>{formatSeconds(Math.floor(currentTime))}</span>
          <span>{formatSeconds(Math.floor(duration))}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => skip(-15)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Retroceder 15s"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          onClick={togglePlay}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={() => skip(15)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Adelantar 15s"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Secondary controls */}
      <div className="mt-4 flex items-center justify-between">
        {/* Speed control */}
        <button
          onClick={cyclePlaybackRate}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Velocidad de reproducción"
        >
          <Gauge className="h-3.5 w-3.5" />
          {playbackRate}x
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1.5 rounded-full appearance-none bg-neutral-200 dark:bg-neutral-700 cursor-pointer accent-primary-600"
          />
        </div>
      </div>
    </div>
  )
}
