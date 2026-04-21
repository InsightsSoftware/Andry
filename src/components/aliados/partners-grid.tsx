'use client'

import { useState, useMemo } from 'react'
import {
  Handshake,
  ExternalLink,
  Star,
  Play,
  Filter,
  X,
} from 'lucide-react'
import { CATEGORIA_LABELS_SHORT as CATEGORIA_LABELS } from '@/lib/partners'
import type { Partner, PartnerCategoria } from '@/types/database'

function isYoutubeOrExternal(url: string): 'youtube' | 'external' | 'video' {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (url.startsWith('http')) return 'external'
  return 'video'
}

function youtubeEmbedUrl(url: string): string {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/)
  const id = m?.[1]
  return id ? `https://www.youtube.com/embed/${id}` : url
}

export function PartnersGrid({ partners }: { partners: Partner[] }) {
  const [categoria, setCategoria] = useState<PartnerCategoria | null>(null)

  const filteredPartners = useMemo(
    () =>
      categoria ? partners.filter((p) => p.categoria === categoria) : partners,
    [partners, categoria]
  )

  // Only show filter pills for categories that actually have partners
  const availableCategorias = useMemo(() => {
    const set = new Set<PartnerCategoria>()
    for (const p of partners) set.add(p.categoria)
    return Array.from(set)
  }, [partners])

  if (partners.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
        <Handshake className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
        <p className="font-semibold text-neutral-700 dark:text-neutral-300">
          Aún no hay aliados publicados
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Pronto vas a ver acá empresas recomendadas para hacer crecer tu negocio.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Categoria filter */}
      {availableCategorias.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-neutral-400" />
          <button
            onClick={() => setCategoria(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              categoria === null
                ? 'border-accent-500 bg-accent-500 text-neutral-900'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-accent-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
            }`}
          >
            Todos
          </button>
          {availableCategorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                categoria === cat
                  ? 'border-accent-500 bg-accent-500 text-neutral-900'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-accent-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
              }`}
            >
              {CATEGORIA_LABELS[cat]}
            </button>
          ))}
          {categoria && (
            <button
              onClick={() => setCategoria(null)}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPartners.map((p) => (
          <PartnerCard key={p.id} partner={p} />
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Ninguno en esta categoría por ahora.
          </p>
        </div>
      )}
    </div>
  )
}

function PartnerCard({ partner }: { partner: Partner }) {
  const [playing, setPlaying] = useState(false)
  const videoType = isYoutubeOrExternal(partner.video_url)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      {/* Video / poster area */}
      <div className="relative aspect-video w-full bg-neutral-900">
        {playing ? (
          videoType === 'youtube' ? (
            <iframe
              src={`${youtubeEmbedUrl(partner.video_url)}?autoplay=1&rel=0`}
              title={partner.nombre}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <video
              src={partner.video_url}
              autoPlay
              controls
              playsInline
              className="absolute inset-0 h-full w-full"
            />
          )
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex items-center justify-center cursor-pointer group/play"
            aria-label={`Reproducir video de ${partner.nombre}`}
          >
            {partner.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partner.logo_url}
                alt={partner.nombre}
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover/play:opacity-40"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-neutral-900 to-accent-900" />
            )}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary-700 shadow-xl transition-transform group-hover/play:scale-110">
              <Play className="h-6 w-6 translate-x-0.5 fill-current" />
            </div>
          </button>
        )}

        {partner.destacado && !playing && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2.5 py-1 text-[10px] font-bold text-neutral-900 shadow-lg">
            <Star className="h-2.5 w-2.5 fill-current" />
            Destacado
          </div>
        )}

        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {CATEGORIA_LABELS[partner.categoria]}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 font-bold text-neutral-900 dark:text-neutral-100">
          {partner.nombre}
        </h3>
        <p className="mb-4 flex-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
          {partner.descripcion}
        </p>

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
      </div>
    </div>
  )
}
