'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  ChevronRight,
  CheckCircle2,
  Headphones,
} from 'lucide-react'
import { cn, formatSeconds } from '@/lib/utils'
import { updateProgress } from '@/actions/estudio'

export interface Track {
  id: string
  titulo: string
  codigo: string
  orden: number
  url: string
  duracionSegundos: number | null
  capituloId: string | null
  capituloNumero: number
  capituloNombre: string
  cursoId: string | null
  cursoNombre: string
  progresoPct: number
  posicionInicial: string
  completado: boolean
}

export interface CapituloOption {
  id: string
  numero: number
  nombre: string
}

interface Props {
  tracks: Track[]
  capitulos: CapituloOption[]
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]
const PROGRESS_SAVE_INTERVAL_MS = 15000

export function AudiosPlaylist({ tracks, capitulos }: Props) {
  // ── State ───────────────────────────────────────────────────
  const [selectedCapituloId, setSelectedCapituloId] = useState<string | null>(
    capitulos[0]?.id ?? null
  )
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(tracks.filter((t) => t.completado).map((t) => t.id))
  )

  const audioRef = useRef<HTMLAudioElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Derived ─────────────────────────────────────────────────
  const tracksByCapitulo = useMemo(() => {
    const m = new Map<string, Track[]>()
    for (const t of tracks) {
      const key = t.capituloId ?? 'sin-capitulo'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(t)
    }
    return m
  }, [tracks])

  const visibleTracks = useMemo(
    () => tracksByCapitulo.get(selectedCapituloId ?? '') ?? [],
    [tracksByCapitulo, selectedCapituloId]
  )

  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeTrackId) ?? null,
    [tracks, activeTrackId]
  )

  const activeChapterTotal = visibleTracks.length
  const activeChapterCompleted = visibleTracks.filter((t) =>
    completedIds.has(t.id)
  ).length
  const chapterPct =
    activeChapterTotal > 0
      ? Math.round((activeChapterCompleted / activeChapterTotal) * 100)
      : 0

  const activeIdx = visibleTracks.findIndex((t) => t.id === activeTrackId)
  const hasPrev = activeIdx > 0
  const hasNext = activeIdx >= 0 && activeIdx < visibleTracks.length - 1

  // ── Audio element effects ───────────────────────────────────
  // Load new track — keep the element around so we don't jump-cut audio
  useEffect(() => {
    const el = audioRef.current
    if (!el || !activeTrack) return
    if (el.src !== activeTrack.url) {
      el.src = activeTrack.url
      el.load()
      const pos = parseFloat(activeTrack.posicionInicial) || 0
      if (pos > 0) el.currentTime = pos
    }
    el.playbackRate = rate
  }, [activeTrack, rate])

  // Progress save loop (only while playing)
  const saveProgressNow = useCallback(async () => {
    const el = audioRef.current
    if (!el || !activeTrack || !el.duration || !Number.isFinite(el.duration))
      return
    const pct = (el.currentTime / el.duration) * 100
    const pos = el.currentTime.toString()
    const result = await updateProgress(activeTrack.id, pct, pos)
    if (result?.completado) {
      setCompletedIds((prev) => {
        if (prev.has(activeTrack.id)) return prev
        const next = new Set(prev)
        next.add(activeTrack.id)
        return next
      })
    }
  }, [activeTrack])

  useEffect(() => {
    if (isPlaying) {
      saveTimerRef.current = setInterval(
        saveProgressNow,
        PROGRESS_SAVE_INTERVAL_MS
      )
    } else if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current)
      saveTimerRef.current = null
    }
    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [isPlaying, saveProgressNow])

  // Save progress on unmount (user navigating away)
  useEffect(() => {
    return () => {
      saveProgressNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handlers ────────────────────────────────────────────────
  function selectTrack(id: string) {
    if (activeTrackId === id) {
      togglePlay()
      return
    }
    setActiveTrackId(id)
    // Defer play until the audio element re-mounts with new src
    setTimeout(() => {
      const el = audioRef.current
      if (!el) return
      el.play().then(() => setIsPlaying(true)).catch(() => {
        // autoplay blocked, user needs to click play
        setIsPlaying(false)
      })
    }, 50)
  }

  function togglePlay() {
    const el = audioRef.current
    if (!el || !activeTrack) return
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }

  function seekTo(t: number) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(t, el.duration || 0))
    setCurrentTime(el.currentTime)
  }

  function skipRelative(delta: number) {
    const el = audioRef.current
    if (!el) return
    seekTo(el.currentTime + delta)
  }

  function previousTrack() {
    if (!hasPrev) return
    selectTrack(visibleTracks[activeIdx - 1].id)
  }

  function nextTrack() {
    if (!hasNext) return
    selectTrack(visibleTracks[activeIdx + 1].id)
  }

  function cycleRate() {
    const i = PLAYBACK_RATES.indexOf(rate)
    const nextRate = PLAYBACK_RATES[(i + 1) % PLAYBACK_RATES.length]
    setRate(nextRate)
    const el = audioRef.current
    if (el) el.playbackRate = nextRate
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            Playlist de audio
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Escuchá mientras trabajás o manejás.
          </p>
        </div>

        {capitulos.length > 1 && (
          <select
            value={selectedCapituloId ?? ''}
            onChange={(e) => {
              setSelectedCapituloId(e.target.value)
              setActiveTrackId(null)
              setIsPlaying(false)
              const el = audioRef.current
              if (el) el.pause()
            }}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm font-medium sm:w-auto cursor-pointer"
          >
            {capitulos.map((c) => (
              <option key={c.id} value={c.id}>
                Cap. {c.numero} — {c.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Track list ──────────────────────────── */}
        <div className="flex flex-col gap-3">
          {visibleTracks.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <Headphones className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
              <p className="text-neutral-500 dark:text-neutral-400">
                No hay audios para este capítulo todavía.
              </p>
            </div>
          )}

          {visibleTracks.map((t, i) => {
            const isActive = t.id === activeTrackId
            const isDone = completedIds.has(t.id)

            return (
              <div key={t.id}>
                {/* Small numeric label above each card */}
                <p className="mb-1.5 px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Módulo {i + 1}
                </p>

                <button
                  type="button"
                  onClick={() => selectTrack(t.id)}
                  className={cn(
                    'group w-full text-left rounded-xl border p-4 transition-all cursor-pointer',
                    'flex items-center gap-3',
                    isActive
                      ? 'border-primary-500 dark:border-primary-400 bg-primary-50/60 dark:bg-primary-900/20 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50'
                    )}
                  >
                    {isActive && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 translate-x-[1px]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {t.codigo}
                    </p>
                    <p
                      className={cn(
                        'truncate text-sm font-semibold',
                        isActive
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-neutral-900 dark:text-neutral-100'
                      )}
                    >
                      {t.titulo}
                    </p>
                  </div>

                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors" />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Persistent player (right rail) ──────────────── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-col gap-4">
            {/* Now playing card */}
            <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 border border-neutral-200 dark:border-neutral-700 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent-500 dark:text-accent-400 mb-2">
                Player
              </p>

              {activeTrack ? (
                <>
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                    {activeTrack.titulo}
                  </p>
                  <p className="mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {activeTrack.codigo.toLowerCase()}
                  </p>

                  {/* Scrubber */}
                  <div className="mt-4">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => seekTo(parseFloat(e.target.value))}
                      className="w-full accent-primary-600 cursor-pointer"
                      aria-label="Posición del audio"
                    />
                    <div className="mt-1 flex justify-between text-[11px] font-medium tabular-nums text-neutral-500 dark:text-neutral-400">
                      <span>{formatSeconds(Math.floor(currentTime))}</span>
                      <span>
                        {duration > 0 ? formatSeconds(Math.floor(duration)) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="mt-5 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={previousTrack}
                      disabled={!hasPrev}
                      aria-label="Anterior"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                      className="flex h-14 w-14 items-center justify-center rounded-full btn-purple text-white shadow-md hover:shadow-lg glow-purple transition-all cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 translate-x-[2px]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={nextTrack}
                      disabled={!hasNext}
                      aria-label="Siguiente"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Secondary controls: skip -15 / +15 / speed */}
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => skipRelative(-15)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <Rewind className="h-3.5 w-3.5" />
                      -15s
                    </button>
                    <button
                      type="button"
                      onClick={() => skipRelative(15)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <FastForward className="h-3.5 w-3.5" />
                      +15s
                    </button>
                    <button
                      type="button"
                      onClick={cycleRate}
                      title="Velocidad"
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors tabular-nums"
                    >
                      {rate}x
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <Headphones className="mx-auto mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Elegí un módulo para empezar
                  </p>
                </div>
              )}
            </div>

            {/* Progress tracker */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Progreso
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500 dark:text-accent-400">
                  Capítulo
                </p>
              </div>
              <p className="mt-1 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {activeChapterCompleted}/{activeChapterTotal} tracks
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-1.5 rounded-full bg-primary-600 transition-all duration-500"
                  style={{ width: `${chapterPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                {chapterPct}% avanzado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element driven by refs */}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setIsPlaying(false)
          saveProgressNow()
          // Auto-advance
          if (hasNext) nextTrack()
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  )
}
