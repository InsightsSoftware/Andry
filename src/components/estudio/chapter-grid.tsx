'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChapterImageUpload } from '@/components/admin/chapter-image-upload'

export interface ChapterCard {
  id: string
  numero: number
  nombre: string
  /** Where clicking the card should take the user — main PDF if available,
   * otherwise the course detail page with a chapter anchor. */
  href: string
  /** Text for the small uppercase label above the title. Usually
   * "CAPÍTULO 01", but "SUPLEMENTO AIA" etc. for out-of-sequence items. */
  label: string
  /** Optional cover image uploaded by admin */
  imagenUrl?: string | null
}

interface Props {
  chapters: ChapterCard[]
  courseName?: string
  isAdmin?: boolean
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ── Per-card component so each card can manage its own imagenUrl state ────────
function ChapterCardItem({
  c,
  isAdmin,
}: {
  c: ChapterCard
  isAdmin: boolean
}) {
  const [imagenUrl, setImagenUrl] = useState<string | null>(c.imagenUrl ?? null)
  const isSupp = c.numero >= 11

  const cardInner = (
    <>
      {imagenUrl ? (
        <>
          <div className="relative h-36 w-full shrink-0 overflow-hidden">
            <Image
              src={imagenUrl}
              alt={c.nombre}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            {/* gradient overlay so label is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
              {isSupp && <Sparkles className="h-3 w-3 text-amber-400" />}
              {c.label}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <h3 className="flex-1 text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2">
              {c.nombre}
            </h3>
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
              <span>{c.href.startsWith('/estudio/pdf/') ? 'Abrir PDF' : 'Abrir capítulo'}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </>
      ) : (
        /* No image — original layout */
        <div className="relative flex flex-1 flex-col gap-4 p-7">
          {/* Soft brand accent in the corner */}
          <div
            className={cn(
              'pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-2xl',
              isSupp ? 'bg-accent-500/30' : 'bg-primary-500/30'
            )}
          />
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
            {isSupp && <Sparkles className="h-3 w-3 text-accent-500" />}
            {c.label}
          </div>
          <h3 className="flex-1 text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-3">
            {c.nombre}
          </h3>
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
            <span>{c.href.startsWith('/estudio/pdf/') ? 'Abrir PDF' : 'Abrir capítulo'}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      )}
    </>
  )

  if (!isAdmin) {
    return (
      <Link
        href={c.href}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200 dark:border-neutral-700',
          'transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md',
          'min-h-[220px] cursor-pointer'
        )}
      >
        {cardInner}
      </Link>
    )
  }

  // Admin: card container is a div, link wraps only the content area
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border',
        'bg-white dark:bg-neutral-900',
        'border-neutral-200 dark:border-neutral-700',
        'transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
      )}
    >
      {/* Clickable navigation area */}
      <Link
        href={c.href}
        className="group relative flex flex-col min-h-[180px]"
      >
        {cardInner}
      </Link>

      {/* Admin image upload strip */}
      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-2">
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
          Portada
        </span>
        <ChapterImageUpload
          capituloId={c.id}
          currentImageUrl={imagenUrl}
          onUpdate={(url) => setImagenUrl(url)}
        />
      </div>
    </div>
  )
}

export function ChapterGrid({ chapters, courseName, isAdmin = false }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = stripAccents(query.trim())
    if (!q) return chapters
    return chapters.filter((c) => {
      const hay = stripAccents(`${c.label} ${c.nombre}`)
      return hay.includes(q)
    })
  }, [chapters, query])

  return (
    <div>
      {/* Search — same clean style as the reference design */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            courseName
              ? `Buscar capítulo en ${courseName}…`
              : 'Buscar capítulo o palabra clave…'
          }
          className={cn(
            'w-full rounded-2xl border pl-11 pr-4 py-3.5 text-sm',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200 dark:border-neutral-700',
            'text-neutral-900 dark:text-neutral-100',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20'
          )}
        />
      </div>

      {/* Grid of chapter cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {chapters.length === 0
              ? 'Los capítulos se están preparando. Pronto tendrás contenido disponible.'
              : `Sin resultados para "${query}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ChapterCardItem key={c.id} c={c} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}
