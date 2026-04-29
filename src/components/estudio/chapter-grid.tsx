'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

interface Props {
  chapters: ChapterCard[]
  courseName?: string
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function ChapterGrid({ chapters, courseName }: Props) {
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => {
            const isSupp = c.numero >= 11
            return (
              <Link
                key={c.id}
                href={c.href}
                className={cn(
                  'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5',
                  'bg-white dark:bg-neutral-900',
                  'border-neutral-200 dark:border-neutral-700',
                  'transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md',
                  'min-h-[180px] cursor-pointer'
                )}
              >
                {/* Soft brand accent in the corner */}
                <div
                  className={cn(
                    'pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-2xl',
                    isSupp
                      ? 'bg-accent-500/30'
                      : 'bg-primary-500/30'
                  )}
                />

                {/* Tiny uppercase label */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  {isSupp && <Sparkles className="h-3 w-3 text-accent-500" />}
                  {c.label}
                </div>

                {/* Title — fixed rows so cards line up nicely */}
                <h3 className="flex-1 text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-3">
                  {c.nombre}
                </h3>

                {/* CTA */}
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
                  <span>{c.href.startsWith('/estudio/pdf/') ? 'Abrir PDF' : 'Abrir capítulo'}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
