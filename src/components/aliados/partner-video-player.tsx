'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

function formatTime(t: number): string {
  if (!isFinite(t) || t < 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Reproductor MP4 con controles PROPIOS (no nativos).
 * Motivo: en iOS el control de volumen nativo se ubica arriba a la derecha y
 * choca con la X de cerrar. Con controles propios el volumen va abajo a la
 * derecha, sobre la barra de duración, y se ve igual en todos los dispositivos.
 */
export function PartnerVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  // Al montar / cambiar de video: reproducir CON sonido al 50%.
  // El modal se abre por un click del usuario, así que el navegador suele
  // permitir el audio. Si lo bloquea, caemos a muteado y el usuario activa
  // el sonido con el botón de volumen. (iOS ignora `volume`: usa el del
  // dispositivo, controlado por los botones físicos.)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.volume = 0.5
    v.muted = false
    v.play()
      .then(() => setPlaying(true))
      .catch(() => {
        v.muted = true
        setMuted(true)
        v.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      })
  }, [src])

  const togglePlay = useCallback(() => {
    const v = ref.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const v = ref.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = ref.current
    if (!v) return
    const t = Number(e.target.value)
    v.currentTime = t
    setCurrent(t)
  }, [])

  const goFullscreen = useCallback(() => {
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (!v) return
    if (typeof v.webkitEnterFullscreen === 'function') v.webkitEnterFullscreen()
    else if (v.requestFullscreen) v.requestFullscreen().catch(() => {})
  }, [])

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className="absolute inset-0 select-none">
      <video
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        preload="auto"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="absolute inset-0 h-full w-full bg-black"
      />

      {/* Play/Pause central (solo cuando está pausado) */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Reproducir"
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform hover:scale-105">
            <Play className="h-7 w-7 translate-x-0.5 fill-white" />
          </span>
        </button>
      )}

      {/* Barra de controles inferior */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pb-2.5 pt-8">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className="shrink-0 text-white/90 hover:text-white transition-colors cursor-pointer"
        >
          {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
        </button>

        <span className="shrink-0 text-[11px] font-medium tabular-nums text-white/90">
          {formatTime(current)}
        </span>

        {/* Barra de duración */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="0.1"
          value={current}
          onChange={onSeek}
          aria-label="Barra de duración del video"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full outline-none
            [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow
            [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
          style={{
            background: `linear-gradient(to right, #8B5CF6 ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
          }}
        />

        <span className="shrink-0 text-[11px] font-medium tabular-nums text-white/90">
          {formatTime(duration)}
        </span>

        {/* Volumen — abajo a la derecha, sobre la barra */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          className="shrink-0 text-white/90 hover:text-white transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={goFullscreen}
          aria-label="Pantalla completa"
          className="shrink-0 text-white/90 hover:text-white transition-colors cursor-pointer"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
