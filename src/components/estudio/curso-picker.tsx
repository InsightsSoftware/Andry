'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ArrowRight } from 'lucide-react'
import { ChapterGrid, type ChapterCard } from '@/components/estudio/chapter-grid'
import { CursoImageUpload } from '@/components/admin/curso-image-upload'
import { type ImagenConfig } from '@/actions/admin'
import { EstudioTour } from '@/components/tour/section-tours'

interface CursoData {
  id: string
  nombre: string
  slug: string
  descripcion?: string | null
  imagenUrl?: string | null
  imagenConfig?: ImagenConfig | null
  cards: ChapterCard[]
}

interface CursoPickerProps {
  cursos: CursoData[]
  isAdmin?: boolean
}

const PROXIMOS = [
  {
    nombre: 'Electricidad',
    gradient: 'from-amber-500/20 via-orange-500/10 to-yellow-500/5',
    accent: 'text-amber-500',
  },
  {
    nombre: 'General Contracts',
    gradient: 'from-emerald-600/20 via-teal-600/10 to-green-600/5',
    accent: 'text-emerald-500',
  },
]

// Fallback gradient when no image is set — cycles by course index
const GRADIENTS = [
  'from-violet-600/30 via-purple-600/20 to-fuchsia-600/10',
  'from-blue-600/30 via-indigo-600/20 to-cyan-600/10',
  'from-amber-500/30 via-orange-500/20 to-yellow-500/10',
  'from-emerald-600/30 via-teal-600/20 to-green-600/10',
]
const ACCENT = ['text-violet-400', 'text-blue-400', 'text-amber-400', 'text-emerald-400']

function CursoCard({
  curso,
  idx,
  isAdmin,
  onClick,
}: {
  curso: CursoData
  idx: number
  isAdmin: boolean
  onClick: () => void
}) {
  const [imagenUrl, setImagenUrl] = useState<string | null>(curso.imagenUrl ?? null)
  const [imagenConfig, setImagenConfig] = useState<ImagenConfig | null>(curso.imagenConfig ?? null)

  const gradient = GRADIENTS[idx % GRADIENTS.length]
  const accent = ACCENT[idx % ACCENT.length]
  const chapterCount = curso.cards.length

  // ── Text contrast based on admin config ──────────────────────────────
  // textDark → dark text on bright image; default → white text
  const textDark = imagenConfig?.textDark ?? false
  const textPrimary = textDark ? 'text-neutral-900' : 'text-neutral-100 dark:text-neutral-100'
  const textMuted = textDark ? 'text-neutral-700' : 'text-neutral-400 dark:text-neutral-400'
  const textAccent = textDark ? 'text-neutral-800' : accent
  const iconBg = textDark ? 'bg-black/10 border-black/20' : 'bg-white/10 dark:bg-white/5 border-white/20'
  const overlayGradient = textDark
    ? 'bg-gradient-to-t from-white/60 via-white/25 to-transparent'
    : 'bg-gradient-to-t from-black/60 via-black/25 to-transparent'

  // ── Image CSS positioning ────────────────────────────────────────────
  const imgStyle: React.CSSProperties = imagenConfig
    ? {
        objectPosition: `${imagenConfig.x}% ${imagenConfig.y}%`,
        transform: `scale(${imagenConfig.zoom})`,
        transformOrigin: `${imagenConfig.x}% ${imagenConfig.y}%`,
      }
    : {}

  const cardInner = (
    <>
      {/* Cover image */}
      {imagenUrl && (
        <Image
          src={imagenUrl}
          alt={curso.nombre}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          style={imgStyle}
          unoptimized
        />
      )}

      {/* Gradient overlay — always present, adapts to text contrast mode */}
      <div
        className={`absolute inset-0 ${
          imagenUrl ? overlayGradient : `bg-gradient-to-br ${gradient}`
        }`}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-8">
        {/* Icon */}
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} border`}>
          <BookOpen className={`h-6 w-6 ${textAccent}`} />
        </div>

        {/* Course name */}
        <h2 className={`flex-1 text-2xl font-bold leading-snug ${textPrimary}`}>
          {curso.nombre}
        </h2>

        {/* Chapter count */}
        <p className={`mt-3 text-sm ${textMuted}`}>
          {chapterCount} {chapterCount === 1 ? 'capítulo' : 'capítulos'}
        </p>

        {/* CTA */}
        <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${textAccent}`}>
          Ver capítulos
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </>
  )

  if (!isAdmin) {
    return (
      <button
        onClick={onClick}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 ${imagenUrl ? 'bg-neutral-900' : `bg-gradient-to-br ${gradient}`} text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xl cursor-pointer min-h-[200px]`}
      >
        {cardInner}
      </button>
    )
  }

  // Admin: card + image upload strip
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 ${imagenUrl ? 'bg-neutral-900' : `bg-gradient-to-br ${gradient}`} transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xl`}>
      {/* Clickable area */}
      <button
        onClick={onClick}
        className="relative flex flex-col min-h-[200px] text-left cursor-pointer w-full"
      >
        {cardInner}
      </button>

      {/* Admin strip */}
      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-2">
        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Portada</span>
        <CursoImageUpload
          cursoId={curso.id}
          currentImageUrl={imagenUrl}
          initialConfig={imagenConfig}
          onUpdate={(url) => setImagenUrl(url)}
          onConfigUpdate={(cfg) => setImagenConfig(cfg)}
        />
      </div>
    </div>
  )
}

export function CursoPicker({ cursos, isAdmin = false }: CursoPickerProps) {
  const [selected, setSelected] = useState<CursoData | null>(
    cursos.length === 1 ? cursos[0] : null
  )

  // ── Single course: skip card selection ──────────────────────────────
  if (cursos.length === 1 && selected) {
    return <ChapterGrid chapters={selected.cards} courseName={selected.nombre} isAdmin={isAdmin} />
  }

  // ── Chapters view ───────────────────────────────────────────────────
  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a cursos
        </button>
        <ChapterGrid chapters={selected.cards} courseName={selected.nombre} isAdmin={isAdmin} />
      </div>
    )
  }

  // ── Course cards grid ───────────────────────────────────────────────
  return (
    <>
    <EstudioTour />
    <div className="grid gap-5 sm:grid-cols-2" data-tour="estudio-curso-card">
      {cursos.map((curso, idx) => (
        <CursoCard
          key={curso.id}
          curso={curso}
          idx={idx}
          isAdmin={isAdmin}
          onClick={() => setSelected(curso)}
        />
      ))}
      {PROXIMOS.map((p) => (
        <div
          key={p.nombre}
          className={`relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-gradient-to-br ${p.gradient} min-h-[200px] opacity-60 cursor-not-allowed select-none`}
        >
          <span className="absolute top-3 right-3 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white/80 dark:bg-neutral-800/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Próximamente
          </span>
          <div className="relative z-10 flex flex-col h-full p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 dark:bg-white/5 border border-white/20">
              <BookOpen className={`h-6 w-6 ${p.accent} opacity-60`} />
            </div>
            <h2 className="flex-1 text-2xl font-bold leading-snug text-neutral-400 dark:text-neutral-500">
              {p.nombre}
            </h2>
            <p className="mt-3 text-sm text-neutral-400 dark:text-neutral-600">
              En desarrollo
            </p>
          </div>
        </div>
      ))}
    </div>
    </>
  )
}
