'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Play,
  ExternalLink,
  MessageCircle,
  Mail,
  Phone,
} from 'lucide-react'
import type { Partner, PartnerVideo } from '@/types/database'

// ── YouTube helpers ──────────────────────────────────────────────────────────
function isYoutube(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url)
}
function youtubeId(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/)
  return m?.[1] ?? null
}
function youtubeEmbed(url: string): string {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : url
}
/** Thumbnail para la lista lateral. YouTube → imagen oficial; si no, el logo del aliado. */
function videoThumb(url: string, fallback: string | null): string | null {
  const id = youtubeId(url)
  if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
  return fallback
}

interface Props {
  partner: Partner
  videos: PartnerVideo[]
  open: boolean
  onClose: () => void
}

export function PartnerVideoModal({ partner, videos, open, onClose }: Props) {
  const [activeId, setActiveId] = useState<string | null>(videos[0]?.id ?? null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Al abrir, arrancar siempre desde el primer video (el principal)
  useEffect(() => {
    if (open) setActiveId(videos[0]?.id ?? null)
  }, [open, videos])

  // Reproducir el MP4 de forma confiable cuando cambia el video.
  // (el atributo autoPlay no dispara bien con el remount por `key`)
  useEffect(() => {
    const el = videoRef.current
    if (!el) return // YouTube usa iframe, no <video>
    el.muted = true
    el.play().catch(() => {
      /* autoplay bloqueado — el usuario puede darle play con los controles */
    })
  }, [activeId])

  // Cerrar con Esc + bloquear scroll del fondo mientras está abierto
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const active = videos.find((v) => v.id === activeId) ?? videos[0]
  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Videos de ${partner.nombre}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal shell */}
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── Left: player + info ─────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Video */}
          <div className="relative aspect-video w-full shrink-0 bg-black">
            {isYoutube(active.video_url) ? (
              <iframe
                key={active.id}
                src={`${youtubeEmbed(active.video_url)}?autoplay=1&rel=0`}
                title={active.titulo}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <video
                key={active.id}
                ref={videoRef}
                src={active.video_url}
                autoPlay
                muted
                controls
                playsInline
                preload="auto"
                className="absolute inset-0 h-full w-full"
              />
            )}
          </div>

          {/* Active video title + description */}
          <div className="p-4 sm:p-5">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {active.titulo}
            </h2>
            {active.descripcion && (
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {active.descripcion}
              </p>
            )}

            {/* Partner info + contact */}
            <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-500">
                {partner.categoria}
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {partner.nombre}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {partner.descripcion}
              </p>

              {/* Contact buttons */}
              <div className="mt-4 flex flex-col gap-2">
                {partner.sitio_web && (
                  <a
                    href={partner.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    {partner.cta_text}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {(partner.whatsapp ||
                  partner.email_contacto ||
                  partner.telefono) && (
                  <div className="flex flex-wrap gap-2">
                    {partner.whatsapp && (
                      <a
                        href={`https://wa.me/${partner.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}
                    {partner.email_contacto && (
                      <a
                        href={`mailto:${partner.email_contacto}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </a>
                    )}
                    {partner.telefono && (
                      <a
                        href={`tel:${partner.telefono.replace(/\s/g, '')}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Llamar
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: video list ───────────────────────────────── */}
        <div className="flex w-full shrink-0 flex-col border-t border-neutral-200 dark:border-neutral-800 lg:w-80 lg:border-l lg:border-t-0">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Más videos de {partner.nombre}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </p>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2 lg:max-h-none">
            {videos.map((v) => {
              const isActive = v.id === active.id
              const thumb = videoThumb(v.video_url, partner.logo_url)
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveId(v.id)}
                  className={`flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-accent-500/10 ring-1 ring-accent-500/40'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={v.titulo}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-accent-900" />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="h-5 w-5 fill-white text-white" />
                      </div>
                    )}
                  </div>

                  {/* Title + description */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`line-clamp-2 text-xs font-semibold ${
                        isActive
                          ? 'text-accent-700 dark:text-accent-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {v.titulo}
                    </p>
                    {v.descripcion && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {v.descripcion}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
