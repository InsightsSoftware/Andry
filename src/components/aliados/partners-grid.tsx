'use client'

import { useState, useMemo } from 'react'
import { Handshake, Star, Play, Filter, X, PlaySquare, Phone } from 'lucide-react'
import { CATEGORIA_LABELS_SHORT as CATEGORIA_LABELS } from '@/lib/partners'
import type { Partner, PartnerVideo, PartnerCategoria } from '@/types/database'
import { AliadosTour } from '@/components/tour/section-tours'
import { PartnerVideoModal } from '@/components/aliados/partner-video-modal'
import { ContactPopover } from '@/components/aliados/contact-popover'

export type PartnerWithVideos = Partner & { videos: PartnerVideo[] }

function isYoutube(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url)
}

function youtubeThumb(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/)
  return m?.[1] ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

type ContactState = {
  partner: PartnerWithVideos
  origin: { x: number; y: number }
}

export function PartnersGrid({ partners }: { partners: PartnerWithVideos[] }) {
  const [categoria, setCategoria] = useState<PartnerCategoria | null>(null)
  const [openPartner, setOpenPartner] = useState<PartnerWithVideos | null>(null)
  const [contact, setContact] = useState<ContactState | null>(null)

  const filteredPartners = useMemo(
    () =>
      categoria ? partners.filter((p) => p.categoria === categoria) : partners,
    [partners, categoria]
  )

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
      <AliadosTour />

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
      <div data-tour="aliados-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPartners.map((p) => (
          <PartnerCard
            key={p.id}
            partner={p}
            onOpen={() => setOpenPartner(p)}
            onContact={(origin) => setContact({ partner: p, origin })}
          />
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Ninguno en esta categoría por ahora.
          </p>
        </div>
      )}

      {/* Video modal */}
      {openPartner && (
        <PartnerVideoModal
          partner={openPartner}
          videos={openPartner.videos}
          open={!!openPartner}
          onClose={() => setOpenPartner(null)}
        />
      )}

      {/* Contact pop-up (copiar teléfono / email) */}
      {contact && (
        <ContactPopover
          phone={contact.partner.telefono}
          email={contact.partner.email_contacto}
          origin={contact.origin}
          onClose={() => setContact(null)}
        />
      )}
    </div>
  )
}

function PartnerCard({
  partner,
  onOpen,
  onContact,
}: {
  partner: PartnerWithVideos
  onOpen: () => void
  onContact: (origin: { x: number; y: number }) => void
}) {
  const firstVideo = partner.videos[0]

  // Portada: imagen subida → thumbnail de YouTube → logo. Si nada de eso y el
  // video es un MP4, mostramos el primer frame del propio video.
  const imgPoster =
    partner.imagen_portada ||
    (firstVideo ? youtubeThumb(firstVideo.video_url) : null) ||
    partner.logo_url
  const mp4Frame =
    !imgPoster && firstVideo && !isYoutube(firstVideo.video_url)
      ? firstVideo.video_url
      : null

  const videoCount = partner.videos.length
  const hasContact = !!(partner.telefono || partner.email_contacto)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      {/* Poster / play — abre el modal de videos */}
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-video w-full cursor-pointer bg-neutral-900 text-left"
        aria-label={`Ver videos de ${partner.nombre}`}
      >
        {imgPoster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgPoster}
            alt={partner.nombre}
            className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-50"
          />
        ) : mp4Frame ? (
          <video
            src={`${mp4Frame}#t=0.5`}
            preload="metadata"
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-neutral-900 to-accent-900" />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary-700 shadow-xl transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 translate-x-0.5 fill-current" />
          </div>
        </div>

        {partner.destacado && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2.5 py-1 text-[10px] font-bold text-neutral-900 shadow-lg">
            <Star className="h-2.5 w-2.5 fill-current" />
            Destacado
          </div>
        )}

        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          <PlaySquare className="h-3 w-3" />
          {videoCount} {videoCount === 1 ? 'video' : 'videos'}
        </div>

        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {CATEGORIA_LABELS[partner.categoria]}
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 font-bold text-neutral-900 dark:text-neutral-100">
          {partner.nombre}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {partner.descripcion}
        </p>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/40 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Ver videos
          </button>
          {hasContact && (
            <button
              type="button"
              onClick={(e) => onContact({ x: e.clientX, y: e.clientY })}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-3 py-2 text-xs font-semibold text-neutral-900 transition-colors hover:bg-accent-400 cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5" />
              {partner.cta_text || 'Contactar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
