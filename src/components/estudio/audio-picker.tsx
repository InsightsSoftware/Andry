'use client'

import { useState } from 'react'
import { ArrowLeft, BookOpen, Headphones, ArrowRight, Music } from 'lucide-react'
import { AudiosPlaylist, type Track, type CapituloOption } from '@/components/estudio/audios-playlist'

// ── Data types ────────────────────────────────────────────────────────────────

export interface AudioCapitulo {
  id: string
  numero: number
  nombre: string
  tracks: Track[]
}

export interface AudioCurso {
  id: string
  nombre: string
  capitulos: AudioCapitulo[]
}

interface Props {
  cursos: AudioCurso[]
}

// Gradients per course index
const GRADIENTS = [
  'from-violet-600/30 via-purple-600/20 to-fuchsia-600/10',
  'from-blue-600/30 via-indigo-600/20 to-cyan-600/10',
  'from-amber-500/30 via-orange-500/20 to-yellow-500/10',
  'from-emerald-600/30 via-teal-600/20 to-green-600/10',
]
const ACCENT = ['text-violet-400', 'text-blue-400', 'text-amber-400', 'text-emerald-400']

// ── Component ─────────────────────────────────────────────────────────────────

export function AudioPicker({ cursos }: Props) {
  const [selectedCurso, setSelectedCurso] = useState<AudioCurso | null>(
    cursos.length === 1 ? cursos[0] : null
  )
  const [selectedCapitulo, setSelectedCapitulo] = useState<AudioCapitulo | null>(null)

  // ── Step 3: Audio player for selected chapter ─────────────────────────────
  if (selectedCurso && selectedCapitulo) {
    const capOption: CapituloOption = {
      id: selectedCapitulo.id,
      numero: selectedCapitulo.numero,
      nombre: selectedCapitulo.nombre,
    }
    return (
      <div>
        <button
          onClick={() => setSelectedCapitulo(null)}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a capítulos
        </button>
        <AudiosPlaylist
          tracks={selectedCapitulo.tracks}
          capitulos={[capOption]}
        />
      </div>
    )
  }

  // ── Step 2: Chapter cards for selected course ─────────────────────────────
  if (selectedCurso) {
    return (
      <div>
        {cursos.length > 1 && (
          <button
            onClick={() => setSelectedCurso(null)}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cursos
          </button>
        )}

        {selectedCurso.capitulos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
            <Headphones className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="text-neutral-500 dark:text-neutral-400">
              Sin audios disponibles en este curso todavía.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCurso.capitulos.map((cap) => {
              const isSupp = cap.numero >= 11
              const trackCount = cap.tracks.length
              return (
                <button
                  key={cap.id}
                  onClick={() => setSelectedCapitulo(cap)}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-7 text-left transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md min-h-[200px] cursor-pointer"
                >
                  {/* Glow */}
                  <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary-500/20 opacity-40 blur-2xl" />

                  {/* Label */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                    {isSupp ? 'SUPLEMENTO' : `CAPÍTULO ${String(cap.numero).padStart(2, '0')}`}
                  </div>

                  {/* Name */}
                  <h3 className="flex-1 text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-3">
                    {cap.nombre}
                  </h3>

                  {/* Track count */}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                    <Music className="h-3.5 w-3.5" />
                    {trackCount} {trackCount === 1 ? 'módulo' : 'módulos'}
                  </p>

                  {/* CTA */}
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
                    Escuchar
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Step 1: Course cards ──────────────────────────────────────────────────
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cursos.map((curso, idx) => {
        const gradient = GRADIENTS[idx % GRADIENTS.length]
        const accent = ACCENT[idx % ACCENT.length]
        const totalCaps = curso.capitulos.length

        return (
          <button
            key={curso.id}
            onClick={() => setSelectedCurso(curso)}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br ${gradient} p-8 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xl cursor-pointer min-h-[200px]`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 dark:bg-white/5 border border-white/20">
              <Headphones className={`h-6 w-6 ${accent}`} />
            </div>

            <h2 className="flex-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
              {curso.nombre}
            </h2>

            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              {totalCaps} {totalCaps === 1 ? 'capítulo' : 'capítulos'}
            </p>

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
