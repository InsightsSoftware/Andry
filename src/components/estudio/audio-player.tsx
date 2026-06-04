'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  ChevronLeft,
  ChevronRight,
  List,
} from 'lucide-react'
import { formatSeconds } from '@/lib/utils'

interface AudioPlayerProps {
  contenidoId: string
  archivoUrl: string
  titulo: string
  descripcion: string | null
  duracionSegundos: number | null
  initialProgress: number
  /** Previous audio in the same chapter, if any */
  prev?: { id: string; titulo: string } | null
  /** Next audio in the same chapter, if any */
  next?: { id: string; titulo: string } | null
  /** Where the "back to list" button should point */
  backHref?: string
  /** Course name — shown as the "album" on CarPlay / lockscreen */
  cursoNombre?: string
  /** Chapter name — shown alongside the course on CarPlay / lockscreen */
  capituloNombre?: string
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]

export function AudioPlayer({
  contenidoId,
  archivoUrl,
  titulo,
  duracionSegundos,
  initialProgress,
  prev = null,
  next = null,
  backHref,
  cursoNombre,
  capituloNombre,
}: AudioPlayerProps) {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
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

  // ── Media Session ────────────────────────────────────────────────────────────
  // Tells CarPlay / lockscreen the module title, chapter and artwork — otherwise
  // iOS falls back to showing the raw audio host (e.g. *.supabase.co).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: titulo,
      artist: 'Y Exam Prep',
      album: [cursoNombre, capituloNombre].filter(Boolean).join(' · ') || 'Y Exam Prep',
      artwork: [
        { src: '/icon.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      ],
    })
  }, [titulo, cursoNombre, capituloNombre])

  // Hardware controls (steering-wheel buttons, lockscreen, CarPlay)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { ms.setActionHandler(action, handler) } catch { /* action unsupported */ }
    }
    set('play', () => { audioRef.current?.play(); setIsPlaying(true) })
    set('pause', () => { audioRef.current?.pause(); setIsPlaying(false) })
    set('seekbackward', () => {
      const el = audioRef.current
      if (el) el.currentTime = Math.max(0, el.currentTime - 15)
    })
    set('seekforward', () => {
      const el = audioRef.current
      if (el) el.currentTime = Math.min(el.duration || 0, el.currentTime + 15)
    })
    set('previoustrack', prev ? () => router.push(`/estudio/audio/${prev.id}`) : null)
    set('nexttrack', next ? () => router.push(`/estudio/audio/${next.id}`) : null)
    return () => {
      ;(['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack'] as const)
        .forEach((a) => set(a, null))
    }
  }, [prev, next, router])

  // Reflect play/pause state on the car/lockscreen UI
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      // Los audios siempre arrancan en 0 (sin "retomar donde quedaste").
    }
  }

  const handleTimeUpdate = () => {
    const el = audioRef.current
    if (!el) return
    setCurrentTime(el.currentTime)
    // Keep the CarPlay / lockscreen scrubber in sync
    if ('mediaSession' in navigator && el.duration && Number.isFinite(el.duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: el.duration,
          playbackRate: el.playbackRate,
          position: el.currentTime,
        })
      } catch { /* setPositionState unsupported */ }
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

      {/* Chapter navigation: previous / back / next */}
      {(prev || next || backHref) && (
        <div className="mt-5 flex items-stretch gap-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
          {prev ? (
            <Link
              href={`/estudio/audio/${prev.id}`}
              className="group flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-left transition-colors hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
              title={`Anterior: ${prev.titulo}`}
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-primary-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Anterior
                </p>
                <p className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {prev.titulo}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400"
              title="Volver a la lista del curso"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Curso</span>
            </Link>
          )}

          {next ? (
            <Link
              href={`/estudio/audio/${next.id}`}
              className="group flex flex-1 items-center justify-end gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-right transition-colors hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
              title={`Siguiente: ${next.titulo}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  Siguiente
                </p>
                <p className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {next.titulo}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-primary-500" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      )}
    </div>
  )
}
