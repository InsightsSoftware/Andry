'use client'

/**
 * CursoImageAdjust
 * Modal that lets admins pan + zoom a course cover image and set the
 * text-contrast mode (dark text vs white text).
 *
 * Auto-contrast: draws a small canvas sample of the image and computes
 * average perceived luminance to suggest textDark automatically.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, Sun, Moon, Wand2, Loader2, CheckCircle } from 'lucide-react'
import { updateCursoImageConfig, type ImagenConfig } from '@/actions/admin'

interface Props {
  cursoId: string
  imagenUrl: string
  initialConfig: ImagenConfig | null
  onClose: () => void
  onSaved: (config: ImagenConfig) => void
}

const DEFAULT_CONFIG: ImagenConfig = { x: 50, y: 50, zoom: 1, textDark: false }

// ── Canvas-based brightness detection ──────────────────────────────────────
function detectBrightness(imgEl: HTMLImageElement): number {
  try {
    const SIZE = 80
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return 128
    ctx.drawImage(imgEl, 0, 0, SIZE, SIZE)
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE)
    let total = 0
    const pixels = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      // Perceived luminance (ITU-R BT.601)
      total += (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000
    }
    return total / pixels
  } catch {
    return 128
  }
}

export function CursoImageAdjust({ cursoId, imagenUrl, initialConfig, onClose, onSaved }: Props) {
  const [cfg, setCfg] = useState<ImagenConfig>(initialConfig ?? DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Drag state
  const dragging = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, x: 0, y: 0 })
  const previewRef = useRef<HTMLDivElement>(null)

  // Hidden <img> for brightness sampling
  const sampleImgRef = useRef<HTMLImageElement | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Drag-to-pan ──────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, x: cfg.x, y: cfg.y }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    // Pixel delta → % of preview size
    const dx = ((e.clientX - dragStart.current.mx) / rect.width) * 100
    const dy = ((e.clientY - dragStart.current.my) / rect.height) * 100
    // Invert direction so drag feels natural (drag right = pan right = x decreases)
    const newX = Math.min(100, Math.max(0, dragStart.current.x - dx))
    const newY = Math.min(100, Math.max(0, dragStart.current.y - dy))
    setCfg((prev) => ({ ...prev, x: newX, y: newY }))
  }

  function onPointerUp() {
    dragging.current = false
  }

  // ── Auto-contrast ────────────────────────────────────────────────────
  function handleAutoContrast() {
    // Try the already-loaded hidden img
    if (sampleImgRef.current && sampleImgRef.current.complete) {
      const brightness = detectBrightness(sampleImgRef.current)
      setCfg((prev) => ({ ...prev, textDark: brightness > 140 }))
      showToast(brightness > 140 ? 'Imagen clara → texto oscuro' : 'Imagen oscura → texto blanco')
      return
    }
    // Fallback: create a temporary image
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const brightness = detectBrightness(img)
      setCfg((prev) => ({ ...prev, textDark: brightness > 140 }))
      showToast(brightness > 140 ? 'Imagen clara → texto oscuro' : 'Imagen oscura → texto blanco')
    }
    img.onerror = () => showToast('No se pudo medir el brillo')
    img.src = imagenUrl
  }

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateCursoImageConfig(cursoId, cfg)
      if ('error' in result && result.error) throw new Error(result.error)
      onSaved(cfg)
      onClose()
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Styles for the preview image ─────────────────────────────────────
  const imageStyle: React.CSSProperties = {
    objectPosition: `${cfg.x}% ${cfg.y}%`,
    transform: `scale(${cfg.zoom})`,
    transformOrigin: `${cfg.x}% ${cfg.y}%`,
  }

  const textClass = cfg.textDark
    ? 'text-neutral-900'
    : 'text-white'

  const overlayClass = cfg.textDark
    ? 'bg-gradient-to-t from-white/70 via-white/30 to-transparent'
    : 'bg-gradient-to-t from-black/70 via-black/30 to-transparent'

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Hidden img for brightness sampling */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={sampleImgRef}
        src={imagenUrl}
        alt=""
        crossOrigin="anonymous"
        className="hidden"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Ajustar imagen de portada
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview card — drag to pan */}
          <div>
            <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
              Arrastrá para ajustar la posición
            </p>
            <div
              ref={previewRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-grab active:cursor-grabbing select-none"
              style={{ aspectRatio: '16/9' }}
            >
              <Image
                src={imagenUrl}
                alt="preview"
                fill
                className="object-cover pointer-events-none"
                style={imageStyle}
                unoptimized
                draggable={false}
              />
              {/* Overlay */}
              <div className={`absolute inset-0 ${overlayClass}`} />
              {/* Sample text overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className={`text-sm font-bold leading-snug ${textClass} drop-shadow-sm`}>
                  Nombre del curso
                </p>
                <p className={`text-xs mt-0.5 ${textClass} opacity-70`}>
                  10 capítulos
                </p>
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Zoom
              </label>
              <span className="text-xs text-neutral-400 tabular-nums">
                {cfg.zoom.toFixed(1)}×
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCfg((p) => ({ ...p, zoom: Math.max(1, p.zoom - 0.1) }))}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={cfg.zoom}
                onChange={(e) => setCfg((p) => ({ ...p, zoom: parseFloat(e.target.value) }))}
                className="flex-1 accent-primary-600 cursor-pointer"
              />
              <button
                onClick={() => setCfg((p) => ({ ...p, zoom: Math.min(3, p.zoom + 0.1) }))}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Text contrast */}
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Color del texto
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCfg((p) => ({ ...p, textDark: false }))}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer border ${
                  !cfg.textDark
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-400'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Blanco
              </button>
              <button
                onClick={() => setCfg((p) => ({ ...p, textDark: true }))}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer border ${
                  cfg.textDark
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-400'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Oscuro
              </button>
              <button
                onClick={handleAutoContrast}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-400 transition-colors cursor-pointer ml-auto"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Auto-detectar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 px-5 py-3">
          <button
            onClick={() => setCfg(DEFAULT_CONFIG)}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
          >
            Restablecer
          </button>
          <div className="flex items-center gap-2">
            {toast && (
              <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {toast}
              </span>
            )}
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
