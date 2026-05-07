'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, HelpCircle, BookOpen, ChevronRight, Archive } from 'lucide-react'
import { CSVUploader } from './csv-uploader'
import { CsvBackupsList } from './csv-backups-list'
import { QuestionList } from './question-list'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PMCurso {
  id: string
  nombre: string
}

export interface PMCapitulo {
  id: string
  curso_id: string
  numero: number
  nombre: string
}

interface Question {
  id: string
  texto: string
  respuesta_correcta: string
  pagina_libro: number | null
  capitulo_id: string
  capitulos: { nombre: string; cursos: { nombre: string } | null } | null
}

interface Backup {
  id: string
  capitulo_id: string
  archivo_nombre: string
  cantidad_preguntas: number
  created_at: string
  capitulos: {
    nombre: string
    numero: number
    cursos: { nombre: string } | null
  } | null
}

interface Props {
  cursos: PMCurso[]
  capitulos: PMCapitulo[]
  questions: Question[]
  backups: Backup[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PreguntasManager({ cursos, capitulos, questions, backups }: Props) {
  const [selectedCurso,    setSelectedCurso]    = useState<PMCurso | null>(
    cursos.length === 1 ? cursos[0] : null
  )
  const [selectedCapitulo, setSelectedCapitulo] = useState<PMCapitulo | null>(null)

  // ── Derived counts ────────────────────────────────────────────────────────
  const qByCapitulo = useMemo(() => {
    const m = new Map<string, number>()
    for (const q of questions) m.set(q.capitulo_id, (m.get(q.capitulo_id) ?? 0) + 1)
    return m
  }, [questions])

  const qByCurso = useMemo(() => {
    const m = new Map<string, number>()
    for (const curso of cursos) {
      const caps = capitulos.filter((c) => c.curso_id === curso.id)
      const total = caps.reduce((s, c) => s + (qByCapitulo.get(c.id) ?? 0), 0)
      m.set(curso.id, total)
    }
    return m
  }, [cursos, capitulos, qByCapitulo])

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Course cards
  // ════════════════════════════════════════════════════════════════════════════
  if (!selectedCurso) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {questions.length} pregunta{questions.length === 1 ? '' : 's'} en total
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.map((curso) => {
            const total = qByCurso.get(curso.id) ?? 0
            const caps  = capitulos.filter((c) => c.curso_id === curso.id)
            return (
              <button
                key={curso.id}
                onClick={() => setSelectedCurso(curso)}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md cursor-pointer min-h-[160px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <HelpCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {curso.nombre}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {caps.length} capítulo{caps.length === 1 ? '' : 's'} · {total} pregunta{total === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                  Ver capítulos
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 — Chapter cards for selected course
  // ════════════════════════════════════════════════════════════════════════════
  const capsDelCurso = capitulos
    .filter((c) => c.curso_id === selectedCurso.id)
    .sort((a, b) => a.numero - b.numero)

  if (!selectedCapitulo) {
    return (
      <div className="space-y-4">
        {cursos.length > 1 && (
          <button
            onClick={() => setSelectedCurso(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cursos
          </button>
        )}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {selectedCurso.nombre} · {capsDelCurso.length} capítulos
        </p>
        {capsDelCurso.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="text-neutral-500 dark:text-neutral-400">Sin capítulos en este curso.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capsDelCurso.map((cap) => {
              const count  = qByCapitulo.get(cap.id) ?? 0
              const isSupp = cap.numero >= 11
              return (
                <button
                  key={cap.id}
                  onClick={() => setSelectedCapitulo(cap)}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md cursor-pointer min-h-[160px]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                    {isSupp ? 'SUPLEMENTO' : `CAPÍTULO ${String(cap.numero).padStart(2, '0')}`}
                  </div>
                  <h3 className="flex-1 font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-3">
                    {cap.nombre}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {count} pregunta{count === 1 ? '' : 's'}
                  </p>
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    Gestionar
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3 — Chapter detail: CSV uploader + backups + questions
  // ════════════════════════════════════════════════════════════════════════════
  const isSupp   = selectedCapitulo.numero >= 11
  const capLabel = isSupp ? 'SUPLEMENTO' : `CAPÍTULO ${String(selectedCapitulo.numero).padStart(2, '0')}`

  const capQuestions = questions.filter((q) => q.capitulo_id === selectedCapitulo.id)
  const capBackups   = backups.filter((b) => b.capitulo_id === selectedCapitulo.id)

  // Chapters for this course — for CSV uploader pre-population
  const chaptersForUploader = capsDelCurso.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    numero: c.numero,
  }))
  const cursosForUploader = [{ id: selectedCurso.id, nombre: selectedCurso.nombre }]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => setSelectedCapitulo(null)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        {selectedCurso.nombre}
      </button>

      {/* Chapter header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{capLabel}</p>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{selectedCapitulo.nombre}</h2>
        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
          {capQuestions.length} pregunta{capQuestions.length === 1 ? '' : 's'} · {capBackups.length} backup{capBackups.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* CSV Upload */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-neutral-700 dark:text-neutral-200">
          Subir Preguntas (CSV)
        </h3>
        <CSVUploader
          allCursos={cursosForUploader}
          allChapters={chaptersForUploader}
          initialCursoId={selectedCurso.id}
          initialCapituloId={selectedCapitulo.id}
          hideSelectors
        />
      </div>

      {/* Backup history */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-700 dark:text-neutral-200">
            <Archive className="h-4 w-4 text-neutral-400" />
            Historial de backups
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {capBackups.length} {capBackups.length === 1 ? 'archivo guardado' : 'archivos guardados'}
          </p>
        </div>
        <CsvBackupsList initialBackups={capBackups} />
      </div>

      {/* Questions list */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-neutral-700 dark:text-neutral-200">
          Preguntas existentes ({capQuestions.length})
        </h3>
        <QuestionList questions={capQuestions} embedded />
      </div>
    </div>
  )
}
