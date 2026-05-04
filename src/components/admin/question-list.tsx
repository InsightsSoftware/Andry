'use client'

import { useMemo, useState } from 'react'
import { Trash2, ChevronDown, ChevronRight, ArrowLeft, HelpCircle, BookOpen, CheckSquare, Square, X } from 'lucide-react'
import { deleteQuestion, deleteQuestions } from '@/actions/admin'
import { useRouter } from 'next/navigation'
import { QuestionImageUpload } from './question-image-upload'
import { OptionImagesUpload } from './option-images-upload'

interface Question {
  id: string
  texto: string
  respuesta_correcta: string
  pagina_libro: number | null
  capitulo_id: string
  imagen_url?: string | null
  opcion_a_imagen_url?: string | null
  opcion_b_imagen_url?: string | null
  opcion_c_imagen_url?: string | null
  opcion_d_imagen_url?: string | null
  capitulos: { nombre: string; cursos: { nombre: string } | null } | null
}

// ── Derived types for navigation ──────────────────────────────────────────────
interface NavCurso {
  nombre: string
  capitulos: NavCapitulo[]
}
interface NavCapitulo {
  id: string
  nombre: string
  questions: Question[]
}

export function QuestionList({
  questions,
  embedded = false,
  isAdmin = true,
}: {
  questions: Question[]
  /** When true, skip course/chapter navigation and render the flat list directly */
  embedded?: boolean
  /** Show admin controls (image upload, etc.) */
  isAdmin?: boolean
}) {
  const router  = useRouter()
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [selectMode,    setSelectMode]    = useState(false)
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
  const [bulkDeleting,  setBulkDeleting]  = useState(false)

  // ── Navigation state ───────────────────────────────────────────────────────
  const [selectedCurso,    setSelectedCurso]    = useState<string | null>(null)
  const [selectedCapitulo, setSelectedCapitulo] = useState<NavCapitulo | null>(null)

  // ── Build curso → capitulo → questions tree ────────────────────────────────
  const tree = useMemo(() => {
    const m = new Map<string, NavCurso>()
    for (const q of questions) {
      const cursoNombre = q.capitulos?.cursos?.nombre ?? 'Sin curso'
      const capNombre   = q.capitulos?.nombre ?? 'Sin capítulo'
      const capId       = q.capitulo_id

      if (!m.has(cursoNombre)) m.set(cursoNombre, { nombre: cursoNombre, capitulos: [] })
      const curso = m.get(cursoNombre)!

      let cap = curso.capitulos.find((c) => c.id === capId)
      if (!cap) {
        cap = { id: capId, nombre: capNombre, questions: [] }
        curso.capitulos.push(cap)
      }
      cap.questions.push(q)
    }
    return Array.from(m.values())
  }, [questions])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    setDeleting(id)
    await deleteQuestion(id)
    setDeleting(null)
    router.refresh()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = (list: Question[]) => {
    const allIds = list.map((q) => q.id)
    const allSelected = allIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const handleBulkDelete = async (list: Question[]) => {
    const ids = list.filter((q) => selectedIds.has(q.id)).map((q) => q.id)
    if (!ids.length) return
    if (!confirm(`¿Eliminar ${ids.length} pregunta${ids.length === 1 ? '' : 's'}?`)) return
    setBulkDeleting(true)
    await deleteQuestions(ids)
    setSelectedIds(new Set())
    setSelectMode(false)
    setBulkDeleting(false)
    router.refresh()
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  // ── Embedded: flat list, no navigation ────────────────────────────────────
  if (embedded) {
    if (questions.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
          <p className="text-neutral-500">No hay preguntas en este capítulo</p>
        </div>
      )
    }

    const selectedInList = questions.filter((q) => selectedIds.has(q.id))
    const allSelected = questions.every((q) => selectedIds.has(q.id))

    return (
      <div className="space-y-2">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Seleccionar
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleSelectAll(questions)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {allSelected ? <CheckSquare className="h-3.5 w-3.5 text-primary-500" /> : <Square className="h-3.5 w-3.5" />}
                {allSelected ? 'Desmarcar todo' : 'Seleccionar todo'}
              </button>
              {selectedInList.length > 0 && (
                <button
                  onClick={() => handleBulkDelete(questions)}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {bulkDeleting ? 'Eliminando...' : `Eliminar ${selectedInList.length}`}
                </button>
              )}
              <button
                onClick={exitSelectMode}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl glass-card divide-y divide-black/5 dark:divide-white/5">
          {questions.map((q) => (
            <div key={q.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                {/* Checkbox (selection mode) or expand toggle */}
                {selectMode ? (
                  <button
                    onClick={() => toggleSelect(q.id)}
                    className="mt-0.5 shrink-0 cursor-pointer"
                  >
                    {selectedIds.has(q.id)
                      ? <CheckSquare className="h-4 w-4 text-primary-500" />
                      : <Square className="h-4 w-4 text-neutral-400" />
                    }
                  </button>
                ) : (
                  <button
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    className="mt-0.5 shrink-0 text-neutral-500 cursor-pointer"
                  >
                    {expandedId === q.id
                      ? <ChevronDown  className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                  </button>
                )}
                <div
                  className="flex-1 min-w-0"
                  onClick={selectMode ? () => toggleSelect(q.id) : undefined}
                  style={selectMode ? { cursor: 'pointer' } : undefined}
                >
                  <p className="text-sm text-neutral-700 dark:text-neutral-200 truncate">{q.texto}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                    <span className="font-mono font-bold text-primary-400 uppercase">
                      Resp: {q.respuesta_correcta}
                    </span>
                    {q.pagina_libro && <span>Pág. {q.pagina_libro}</span>}
                  </div>
                </div>
                {!selectMode && (
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deleting === q.id}
                    className="shrink-0 rounded-lg p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {!selectMode && expandedId === q.id && (
                <div className="mt-2 ml-7 text-xs text-neutral-600 dark:text-neutral-400 bg-black/[0.03] dark:bg-white/[0.02] rounded-lg p-3 border border-black/5 dark:border-white/5">
                  <p className="whitespace-pre-wrap">{q.texto}</p>
                  {isAdmin && (
                    <>
                      <QuestionImageUpload
                        preguntaId={q.id}
                        initialImageUrl={q.imagen_url ?? null}
                      />
                      <OptionImagesUpload
                        preguntaId={q.id}
                        initialImages={{
                          a: q.opcion_a_imagen_url ?? null,
                          b: q.opcion_b_imagen_url ?? null,
                          c: q.opcion_c_imagen_url ?? null,
                          d: q.opcion_d_imagen_url ?? null,
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Course cards
  // ════════════════════════════════════════════════════════════════════════════
  if (!selectedCurso) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {questions.length} pregunta{questions.length === 1 ? '' : 's'} en total
        </p>
        {tree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
            <p className="text-neutral-500">No hay preguntas en el banco</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tree.map((curso) => {
              const total = curso.capitulos.reduce((s, c) => s + c.questions.length, 0)
              return (
                <button
                  key={curso.nombre}
                  onClick={() => setSelectedCurso(curso.nombre)}
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
                      {curso.capitulos.length} capítulo{curso.capitulos.length === 1 ? '' : 's'} · {total} pregunta{total === 1 ? '' : 's'}
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
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 — Chapter cards for selected course
  // ════════════════════════════════════════════════════════════════════════════
  const cursoData = tree.find((c) => c.nombre === selectedCurso)

  if (!selectedCapitulo) {
    const caps = cursoData?.capitulos ?? []
    return (
      <div className="space-y-4">
        {tree.length > 1 && (
          <button
            onClick={() => setSelectedCurso(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cursos
          </button>
        )}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {selectedCurso} · {caps.length} capítulos
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {caps.map((cap) => (
            <button
              key={cap.id}
              onClick={() => setSelectedCapitulo(cap)}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md cursor-pointer min-h-[160px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-3">
                  {cap.nombre}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {cap.questions.length} pregunta{cap.questions.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                Ver preguntas
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3 — Questions list for selected chapter
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      <button
        onClick={() => setSelectedCapitulo(null)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        {selectedCurso}
      </button>

      <div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">{selectedCapitulo.nombre}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {selectedCapitulo.questions.length} pregunta{selectedCapitulo.questions.length === 1 ? '' : 's'}
        </p>
      </div>

      {selectedCapitulo.questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
          <p className="text-neutral-500">No hay preguntas en este capítulo</p>
        </div>
      ) : (
        <div className="rounded-2xl glass-card divide-y divide-black/5 dark:divide-white/5">
          {selectedCapitulo.questions.map((q) => (
            <div key={q.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="mt-0.5 shrink-0 text-neutral-500 cursor-pointer"
                >
                  {expandedId === q.id
                    ? <ChevronDown  className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-700 dark:text-neutral-200 truncate">{q.texto}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                    <span className="font-mono font-bold text-primary-400 uppercase">
                      Resp: {q.respuesta_correcta}
                    </span>
                    {q.pagina_libro && <span>Pág. {q.pagina_libro}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={deleting === q.id}
                  className="shrink-0 rounded-lg p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {expandedId === q.id && (
                <div className="mt-2 ml-7 text-xs text-neutral-600 dark:text-neutral-400 bg-black/[0.03] dark:bg-white/[0.02] rounded-lg p-3 border border-black/5 dark:border-white/5">
                  <p className="whitespace-pre-wrap">{q.texto}</p>
                  {isAdmin && (
                    <QuestionImageUpload
                      preguntaId={q.id}
                      initialImageUrl={q.imagen_url ?? null}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
