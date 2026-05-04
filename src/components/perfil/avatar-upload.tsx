'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Minus, Plus, X, Check, Loader2, Trash2 } from 'lucide-react'
import { AvatarInicial } from '@/components/comunidad/avatar-inicial'
import { uploadAvatar, removeAvatar } from '@/actions/profile'

// ── Constants ─────────────────────────────────────────────────────────────────

const CROP_SIZE = 280          // px — circular preview diameter
const CROP_RADIUS = CROP_SIZE / 2
const OUTPUT_SIZE = 400        // px — saved JPEG dimensions

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  userId: string
  nombre: string | null
  initialAvatarUrl: string | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AvatarUpload({ userId, nombre, initialAvatarUrl }: Props) {
  // Current saved avatar (updates after successful save)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)

  // ── File & crop state ──────────────────────────────────────────────────────
  const [cropOpen, setCropOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  // Natural image dimensions (set after img onLoad)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })

  // Offset of the image center relative to the container center (px)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // zoom: 1.0 = "cover" zoom (image fills the circle)
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)

  // ── Upload state ───────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      setImgSrc(src)
      setOffset({ x: 0, y: 0 })
      setZoom(1)
      setCropOpen(true)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  // ── Image loaded: compute minZoom so image fills the circle ───────────────
  const handleImgLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const { naturalWidth: nw, naturalHeight: nh } = img
    setNaturalSize({ w: nw, h: nh })
    const mz = Math.max(CROP_SIZE / nw, CROP_SIZE / nh)
    setMinZoom(mz)
    setZoom(mz)
    setOffset({ x: 0, y: 0 })
  }, [])

  // ── Clamp offset so image always covers the circle ────────────────────────
  const clampOffset = useCallback(
    (ox: number, oy: number, z: number, nw: number, nh: number) => {
      const maxX = Math.max(0, (nw * z) / 2 - CROP_RADIUS)
      const maxY = Math.max(0, (nh * z) / 2 - CROP_RADIUS)
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      }
    },
    []
  )

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.px
    const dy = e.clientY - dragRef.current.py
    const raw = { x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }
    setOffset(clampOffset(raw.x, raw.y, zoom, naturalSize.w, naturalSize.h))
  }

  const onPointerUp = () => { dragRef.current = null }

  // ── Zoom slider ───────────────────────────────────────────────────────────
  const handleZoom = (newZoom: number) => {
    const clamped = Math.max(minZoom, Math.min(minZoom * 3, newZoom))
    setZoom(clamped)
    setOffset((prev) => clampOffset(prev.x, prev.y, clamped, naturalSize.w, naturalSize.h))
  }

  // ── Cancel crop ───────────────────────────────────────────────────────────
  const handleCancel = () => {
    setCropOpen(false)
    setImgSrc(null)
    setError(null)
  }

  // ── Save: render canvas → upload ──────────────────────────────────────────
  const handleSave = async () => {
    const img = imgRef.current
    if (!img || !naturalSize.w) return

    setUploading(true)
    setError(null)

    try {
      // 1. Render crop to canvas
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!

      // The center of the crop circle corresponds to this image pixel:
      const imgCX = naturalSize.w / 2 - offset.x / zoom
      const imgCY = naturalSize.h / 2 - offset.y / zoom
      const cropRadiusPx = CROP_RADIUS / zoom  // crop radius in image natural pixels

      ctx.drawImage(
        img,
        imgCX - cropRadiusPx,   // source x
        imgCY - cropRadiusPx,   // source y
        cropRadiusPx * 2,       // source width
        cropRadiusPx * 2,       // source height
        0, 0,                   // dest origin
        OUTPUT_SIZE, OUTPUT_SIZE // dest size
      )

      // 2. Get blob as ArrayBuffer → number[] (serializable across server action boundary)
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92)
      )
      const arrayBuffer = await blob.arrayBuffer()
      const imageBytes = Array.from(new Uint8Array(arrayBuffer))

      // 3. Upload via server action
      const result = await uploadAvatar(imageBytes, 'image/jpeg')
      if ('error' in result) throw new Error(result.error)

      setAvatarUrl(result.url + '?t=' + Date.now())
      setCropOpen(false)
      setImgSrc(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setUploading(false)
    }
  }

  // ── Remove avatar ─────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!confirm('¿Eliminar tu foto de perfil?')) return
    setRemoving(true)
    setError(null)
    try {
      const res = await removeAvatar()
      if ('error' in res) throw new Error(res.error)
      setAvatarUrl(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setRemoving(false)
    }
  }

  // Computed image position in the crop container
  const imgLeft = CROP_RADIUS + offset.x - (naturalSize.w * zoom) / 2
  const imgTop = CROP_RADIUS + offset.y - (naturalSize.h * zoom) / 2

  // ── Rendered avatar size on profile page ──────────────────────────────────
  const DISPLAY_SIZE = 80

  return (
    <>
      {/* ── Trigger: avatar with camera overlay ─────────────────────────── */}
      <div className="relative inline-block">
        {/* Avatar circle */}
        <div
          className="relative overflow-hidden rounded-full cursor-pointer group"
          style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
          onClick={() => fileInputRef.current?.click()}
          title="Cambiar foto de perfil"
        >
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            <AvatarInicial nombre={nombre} size="lg" className="h-full w-full !rounded-full" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-5 w-5 text-white" />
            <span className="text-[9px] font-semibold text-white leading-none text-center px-1">
              Cambiar
            </span>
          </div>
        </div>

        {/* Remove button — only when there's a photo */}
        {avatarUrl && !removing && (
          <button
            onClick={handleRemove}
            disabled={removing}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 border border-neutral-600 text-neutral-400 hover:bg-red-600 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
            title="Eliminar foto"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {removing && (
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800">
            <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
          </div>
        )}
      </div>

      {/* Error below trigger */}
      {error && !cropOpen && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Crop modal ──────────────────────────────────────────────────────── */}
      {cropOpen && imgSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">

            {/* Close */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-1 text-base font-bold text-neutral-100">
              Ajustar foto de perfil
            </h2>
            <p className="mb-5 text-xs text-neutral-500">
              Arrastrá para reposicionar · Zoom para acercar
            </p>

            {/* ── Circular crop area ──────────────────────────────────────── */}
            <div className="flex justify-center mb-5">
              {/* Outer: shows the crop boundary */}
              <div
                className="relative select-none"
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
              >
                {/* The circular mask */}
                <div
                  ref={containerRef}
                  className="absolute inset-0 rounded-full overflow-hidden cursor-move ring-4 ring-primary-500/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  style={{ touchAction: 'none' }}
                >
                  {/* Actual image — positioned by computed left/top */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt=""
                    onLoad={handleImgLoad}
                    draggable={false}
                    className="absolute max-w-none pointer-events-none"
                    style={{
                      width: naturalSize.w * zoom,
                      height: naturalSize.h * zoom,
                      left: imgLeft,
                      top: imgTop,
                    }}
                  />
                </div>

                {/* Corner rule lines (like Facebook) */}
                <div className="absolute inset-0 rounded-full pointer-events-none border-2 border-white/20" />
              </div>
            </div>

            {/* ── Zoom slider ─────────────────────────────────────────────── */}
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => handleZoom(zoom - minZoom * 0.1)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="range"
                min={minZoom}
                max={minZoom * 3}
                step={minZoom * 0.01}
                value={zoom}
                onChange={(e) => handleZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-neutral-700 accent-primary-500 cursor-pointer"
              />

              <button
                onClick={() => handleZoom(zoom + minZoom * 0.1)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="mb-3 text-xs text-red-400 text-center">{error}</p>
            )}

            {/* ── Action buttons ───────────────────────────────────────────── */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 rounded-xl border border-neutral-700 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={uploading || !naturalSize.w}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Check className="h-4 w-4" /> Guardar foto</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
