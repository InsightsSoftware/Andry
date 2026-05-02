'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ArrowRight } from 'lucide-react'
import { ChapterGrid, type ChapterCard } from '@/components/estudio/chapter-grid'

interface CursoData {
  id: string
  nombre: string
  slug: string
  descripcion?: string | null
  cards: ChapterCard[]
}

interface CursoPickerProps {
  cursos: CursoData[]
  isAdmin?: boolean
}

// Gradient per course index (cycles if more than 4 courses)
const GRADIENTS = [
  'from-violet-600/30 via-purple-600/20 to-fuchsia-600/10',
  'from-blue-600/30 via-indigo-600/20 to-cyan-600/10',
  'from-amber-500/30 via-orange-500/20 to-yellow-500/10',
  'from-emerald-600/30 via-teal-600/20 to-green-600/10',
]
const ACCENT = ['text-violet-400', 'text-blue-400', 'text-amber-400', 'text-emerald-400']

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
    <div className="grid gap-5 sm:grid-cols-2">
      {cursos.map((curso, idx) => {
        const gradient = GRADIENTS[idx % GRADIENTS.length]
        const accent = ACCENT[idx % ACCENT.length]
        const chapterCount = curso.cards.length

        return (
          <button
            key={curso.id}
            onClick={() => setSelected(curso)}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br ${gradient} p-8 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xl cursor-pointer min-h-[200px]`}
          >
            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 dark:bg-white/5 border border-white/20">
              <BookOpen className={`h-6 w-6 ${accent}`} />
            </div>

            {/* Course name */}
            <h2 className="flex-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
              {curso.nombre}
            </h2>

            {/* Chapter count */}
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              {chapterCount} {chapterCount === 1 ? 'capítulo' : 'capítulos'}
            </p>

            {/* CTA */}
            <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${accent}`}>
              Ver capítulos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
