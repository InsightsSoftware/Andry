'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Headphones,
  Video as VideoIcon,
  FileText,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Plus,
  Upload,
  Link2,
  Clock,
  Hash,
  GripVertical,
  ArrowLeft,
  BookOpen,
  Music,
  ChevronRight,
} from 'lucide-react'
import {
  updateContent,
  deleteContent,
  createContent,
  reorderContent,
} from '@/actions/admin'
import { FileUploader } from './file-uploader'
import { BulkFolderUpload } from './bulk-folder-upload'
import { formatSeconds, cn } from '@/lib/utils'

export interface MediaItem {
  id: string
  capitulo_id: string | null
  tipo: 'audio' | 'video' | 'pdf'
  titulo: string
  descripcion: string | null
  archivo_url: string
  duracion_segundos: number | null
  orden: number
  created_at: string
}

export interface MediaCapitulo {
  id: string
  curso_id: string
  numero: number
  nombre: string
}

export interface MediaCurso {
  id: string
  nombre: string
  slug: string
}

interface Props {
  tipo: 'audio' | 'video' | 'pdf'
  items: MediaItem[]
  capitulos: MediaCapitulo[]
  cursos: MediaCurso[]
}

export function MediaManager({ tipo, items, capitulos, cursos }: Props) {
  const router = useRouter()

  // ── Navigation state ─────────────────────────────────────────────────────
  const [selectedCurso,     setSelectedCurso]     = useState<MediaCurso | null>(
    cursos.length === 1 ? cursos[0] : null
  )
  const [selectedCapitulo,  setSelectedCapitulo]  = useState<MediaCapitulo | null>(null)
  const [showGeneral,       setShowGeneral]       = useState(false)

  // ── List state ────────────────────────────────────────────────────────────
  const [rows,        setRows]        = useState<MediaItem[]>(items)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editTitle,   setEditTitle]   = useState('')
  const [savingId,    setSavingId]    = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  // ── Upload modal state ────────────────────────────────────────────────────
  const [showUpload,     setShowUpload]     = useState(false)
  const [formCapituloId, setFormCapituloId] = useState<string>('')
  const [uploadedUrl,    setUploadedUrl]    = useState('')
  const [uploadMode,     setUploadMode]     = useState<'upload' | 'url'>('upload')
  const [formTitulo,     setFormTitulo]     = useState('')
  const [formDuracion,   setFormDuracion]   = useState('')
  const [formOrden,      setFormOrden]      = useState('0')
  const [formError,      setFormError]      = useState('')
  const [submitting,     setSubmitting]     = useState(false)

  // ── Drag reorder ──────────────────────────────────────────────────────────
  const [dragId,         setDragId]         = useState<string | null>(null)
  const [dragOverId,     setDragOverId]     = useState<string | null>(null)
  const [savingReorder,  setSavingReorder]  = useState<string | null>(null)

  // ── Derived maps ──────────────────────────────────────────────────────────
  const capMap   = useMemo(() => new Map(capitulos.map((c) => [c.id, c])),  [capitulos])
  const cursoMap = useMemo(() => new Map(cursos.map((c) => [c.id, c])),     [cursos])

  const capsByCurso = useMemo(() => {
    const m = new Map<string, MediaCapitulo[]>()
    for (const cap of capitulos) {
      const arr = m.get(cap.curso_id) ?? []
      arr.push(cap)
      m.set(cap.curso_id, arr)
    }
    return m
  }, [capitulos])

  // Item counts
  const countByCap = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      if (!r.capitulo_id) continue
      m.set(r.capitulo_id, (m.get(r.capitulo_id) ?? 0) + 1)
    }
    return m
  }, [rows])

  const countByCurso = useMemo(() => {
    const m = new Map<string, number>()
    for (const curso of cursos) {
      const caps = capsByCurso.get(curso.id) ?? []
      const total = caps.reduce((s, c) => s + (countByCap.get(c.id) ?? 0), 0)
      m.set(curso.id, total)
    }
    return m
  }, [cursos, capsByCurso, countByCap])

  const Icon       = tipo === 'audio' ? Headphones : tipo === 'video' ? VideoIcon : FileText
  const tipoLabel  = tipo === 'audio' ? 'Audio' : tipo === 'video' ? 'Video' : 'PDF'

  // ── Drag helpers ──────────────────────────────────────────────────────────
  function arrayMove<T>(arr: T[], from: number, to: number): T[] {
    const copy = [...arr]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    return copy
  }

  async function handleDropOnChapter(capituloId: string, fromId: string, toId: string) {
    const chapterRows = rows.filter((r) => r.capitulo_id === capituloId).sort((a, b) => a.orden - b.orden)
    const fromIdx = chapterRows.findIndex((r) => r.id === fromId)
    const toIdx   = chapterRows.findIndex((r) => r.id === toId)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
    const reordered = arrayMove(chapterRows, fromIdx, toIdx)
    const optimisticOrden = new Map<string, number>()
    reordered.forEach((r, i) => optimisticOrden.set(r.id, (i + 1) * 10))
    setRows((prev) =>
      prev.map((r) =>
        r.capitulo_id === capituloId && optimisticOrden.has(r.id)
          ? { ...r, orden: optimisticOrden.get(r.id)! }
          : r
      )
    )
    setSavingReorder(capituloId)
    const res = await reorderContent(reordered.map((r) => r.id))
    if (res && 'error' in res && res.error) alert(res.error)
    else router.refresh()
    setSavingReorder(null)
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  function startEdit(item: MediaItem) {
    setEditingId(item.id)
    setEditTitle(item.titulo)
  }

  async function saveEdit(item: MediaItem) {
    const t = editTitle.trim()
    if (!t || t === item.titulo) { setEditingId(null); return }
    setSavingId(item.id)
    const res = await updateContent(item.id, { titulo: t })
    if (res && 'error' in res && res.error) alert(res.error)
    else {
      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, titulo: t } : r)))
      setEditingId(null)
      router.refresh()
    }
    setSavingId(null)
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`¿Eliminar "${item.titulo}"?`)) return
    setDeletingId(item.id)
    const res = await deleteContent(item.id)
    if (res?.error) alert(res.error)
    else { setRows((prev) => prev.filter((r) => r.id !== item.id)); router.refresh() }
    setDeletingId(null)
  }

  function openUpload(capId?: string | null) {
    setUploadedUrl('')
    setFormTitulo('')
    setFormDuracion('')
    setFormOrden('0')
    setFormError('')
    setUploadMode('upload')
    // null/undefined = general (no chapter)
    setFormCapituloId(capId !== undefined ? (capId ?? '') : (selectedCapitulo?.id ?? capitulos[0]?.id ?? ''))
    setShowUpload(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const titulo = formTitulo.trim()
    if (!titulo) return setFormError('Falta el título')
    // Chapter required for audio/pdf, optional for video
    if (!formCapituloId && tipo !== 'video') return setFormError('Elegí un capítulo')
    const archivoUrl = uploadedUrl.trim()
    if (!archivoUrl) return setFormError(uploadMode === 'upload' ? 'Subí un archivo' : 'Pegá una URL')
    setSubmitting(true)
    const res = await createContent({
      capitulo_id: formCapituloId || null,
      tipo,
      titulo,
      archivo_url: archivoUrl,
      duracion_segundos: Number(formDuracion) || undefined,
      orden: Number(formOrden) || 0,
    })
    if (res.error) setFormError(res.error)
    else { setShowUpload(false); router.refresh() }
    setSubmitting(false)
  }

  const targetCap   = formCapituloId ? capMap.get(formCapituloId) : null
  const targetCurso = targetCap ? cursoMap.get(targetCap.curso_id) : null
  const uploadFolder =
    targetCurso && targetCap
      ? `${targetCurso.slug}/capitulo-${String(targetCap.numero).padStart(2, '0')}`
      : 'general'

  // Items for selected chapter OR general section (null capitulo)
  const chapterItems = useMemo(() => {
    if (showGeneral) return rows.filter((r) => !r.capitulo_id).sort((a, b) => a.orden - b.orden)
    if (!selectedCapitulo) return []
    return rows.filter((r) => r.capitulo_id === selectedCapitulo.id).sort((a, b) => a.orden - b.orden)
  }, [rows, selectedCapitulo, showGeneral])

  // Items without any chapter (for the General section)
  const generalCount = useMemo(() => rows.filter((r) => !r.capitulo_id).length, [rows])

  // ══════════════════════════════════════════════════════════════════════════
  // GENERAL VIEW — Videos without chapter
  // ══════════════════════════════════════════════════════════════════════════
  if (showGeneral) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => { setShowGeneral(false); setSelectedCurso(cursos.length === 1 ? cursos[0] : null) }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">SIN CAPÍTULO</p>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Videos Generales</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {chapterItems.length} {tipoLabel.toLowerCase()}{chapterItems.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => openUpload(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Subir {tipoLabel.toLowerCase()}
          </button>
        </div>

        {chapterItems.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
            <Icon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="mb-3 text-neutral-500 dark:text-neutral-400">
              Todavía no hay {tipoLabel.toLowerCase()}s sin capítulo.
            </p>
            <button
              onClick={() => openUpload(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Subir el primero
            </button>
          </div>
        )}

        {chapterItems.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            {chapterItems.map((item, i) => {
              const isEditing  = editingId  === item.id
              const isSaving   = savingId   === item.id
              const isDeleting = deletingId === item.id
              const fileBasename = item.archivo_url.split('/').pop()?.replace(/^\d+_?/, '')
              return (
                <div
                  key={item.id}
                  className={cn('flex items-start gap-3 px-3 py-3 text-sm', i !== 0 && 'border-t border-neutral-100 dark:border-neutral-800')}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item); if (e.key === 'Escape') setEditingId(null) }}
                        className="w-full rounded-lg border border-primary-400 bg-white dark:bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                      />
                    ) : (
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{item.titulo}</p>
                    )}
                    {!isEditing && fileBasename && (
                      <p className="mt-0.5 truncate text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{fileBasename}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(item)} disabled={isSaving} className="rounded-lg p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 cursor-pointer disabled:opacity-50">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item)} disabled={isDeleting} className="rounded-lg p-1.5 text-neutral-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 cursor-pointer disabled:opacity-50">
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Upload modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowUpload(false)}>
            <form onSubmit={handleCreate} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Subir video general</h3>
                <button type="button" onClick={() => setShowUpload(false)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Título</label>
                  <input value={formTitulo} onChange={(e) => setFormTitulo(e.target.value)} required placeholder="Ej: Introducción general" className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Archivo</label>
                  <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-3">
                    <button type="button" onClick={() => setUploadMode('upload')} className={cn('flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium cursor-pointer transition-colors', uploadMode === 'upload' ? 'bg-primary-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800')}>
                      <Upload className="h-3.5 w-3.5" />Subir archivo
                    </button>
                    <button type="button" onClick={() => setUploadMode('url')} className={cn('flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium cursor-pointer transition-colors', uploadMode === 'url' ? 'bg-primary-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800')}>
                      <Link2 className="h-3.5 w-3.5" />Pegar URL
                    </button>
                  </div>
                  {uploadMode === 'upload' ? (
                    <FileUploader tipo={tipo} folder="general" onUploadComplete={(url) => setUploadedUrl(url)} currentUrl={uploadedUrl} />
                  ) : (
                    <input value={uploadedUrl} onChange={(e) => setUploadedUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl glass-input px-3 py-2.5 text-sm" />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Duración (seg)</label>
                  <input value={formDuracion} onChange={(e) => setFormDuracion(e.target.value)} type="number" min="0" placeholder="300" className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm" />
                </div>
              </div>
              {formError && <p className="mt-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-2.5 text-sm text-danger-600 dark:text-danger-400">{formError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setShowUpload(false)} className="rounded-xl px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Subiendo...' : 'Crear video'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Course cards
  // ══════════════════════════════════════════════════════════════════════════
  if (!selectedCurso) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {rows.length} {tipoLabel.toLowerCase()}{rows.length === 1 ? '' : 's'} en total
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* General card — videos only */}
          {tipo === 'video' && (
            <button
              onClick={() => setShowGeneral(true)}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md cursor-pointer min-h-[160px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Icon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                  Videos Generales
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Sin capítulo · {generalCount} {tipoLabel.toLowerCase()}{generalCount === 1 ? '' : 's'}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                Gestionar
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          )}
          {cursos.map((curso) => {
            const count  = countByCurso.get(curso.id) ?? 0
            const caps   = capsByCurso.get(curso.id) ?? []
            return (
              <button
                key={curso.id}
                onClick={() => setSelectedCurso(curso)}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md cursor-pointer min-h-[160px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {curso.nombre}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {caps.length} cap{caps.length === 1 ? 'ítulo' : 'ítulos'} · {count} {tipoLabel.toLowerCase()}{count === 1 ? '' : 's'}
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

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Chapter cards for selected course
  // ══════════════════════════════════════════════════════════════════════════
  if (!selectedCapitulo) {
    const caps = (capsByCurso.get(selectedCurso.id) ?? []).slice().sort((a, b) => a.numero - b.numero)
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
          {selectedCurso.nombre} · {caps.length} capítulos
        </p>

        {caps.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="text-neutral-500 dark:text-neutral-400">Sin capítulos en este curso.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caps.map((cap) => {
              const count  = countByCap.get(cap.id) ?? 0
              const isSupp = cap.numero >= 11
              return (
                <button
                  key={cap.id}
                  onClick={() => { setSelectedCapitulo(cap); setFormCapituloId(cap.id) }}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-left transition-all hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md cursor-pointer min-h-[160px]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                    {isSupp ? 'SUPLEMENTO' : `CAPÍTULO ${String(cap.numero).padStart(2, '0')}`}
                  </div>
                  <h3 className="flex-1 font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-3">
                    {cap.nombre}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Music className="h-3.5 w-3.5" />
                    {count} {tipoLabel.toLowerCase()}{count === 1 ? '' : 's'}
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

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Items list for selected chapter
  // ══════════════════════════════════════════════════════════════════════════
  const isSupp = selectedCapitulo.numero >= 11
  const capLabel = isSupp ? 'SUPLEMENTO' : `CAPÍTULO ${String(selectedCapitulo.numero).padStart(2, '0')}`

  return (
    <div className="space-y-5">
      {/* Breadcrumb nav */}
      <button
        onClick={() => setSelectedCapitulo(null)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        {selectedCurso.nombre}
      </button>

      {/* Chapter header + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{capLabel}</p>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{selectedCapitulo.nombre}</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {chapterItems.length} {tipoLabel.toLowerCase()}{chapterItems.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => openUpload(selectedCapitulo.id)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          Subir {tipoLabel.toLowerCase()}
        </button>
      </div>

      {/* Bulk upload */}
      <BulkFolderUpload
        tipo={tipo}
        capitulos={capitulos}
        cursos={cursos}
      />

      {/* Empty state */}
      {chapterItems.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Icon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-3 text-neutral-500 dark:text-neutral-400">
            Todavía no hay {tipoLabel.toLowerCase()}s en este capítulo.
          </p>
          <button
            onClick={() => openUpload(selectedCapitulo.id)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Subir el primero
          </button>
        </div>
      )}

      {/* Items list */}
      {chapterItems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          {savingReorder === selectedCapitulo.id && (
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 px-4 py-2 text-xs text-primary-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Guardando orden…
            </div>
          )}
          {chapterItems.map((item, i) => {
            const isEditing  = editingId  === item.id
            const isSaving   = savingId   === item.id
            const isDeleting = deletingId === item.id
            const isDragging = dragId     === item.id
            const isDragOver = dragOverId === item.id && dragId !== item.id
            const fileBasename = item.archivo_url.split('/').pop()?.replace(/^\d+_?/, '')
            return (
              <div
                key={item.id}
                draggable={!isEditing}
                onDragStart={() => setDragId(item.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                onDragOver={(e) => {
                  if (!dragId || dragId === item.id) return
                  e.preventDefault()
                  setDragOverId(item.id)
                }}
                onDragLeave={() => { if (dragOverId === item.id) setDragOverId(null) }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (!dragId || dragId === item.id) return
                  handleDropOnChapter(item.capitulo_id ?? '', dragId, item.id)
                  setDragId(null); setDragOverId(null)
                }}
                className={cn(
                  'flex items-start gap-3 px-3 py-3 text-sm transition-colors',
                  i !== 0 && 'border-t border-neutral-100 dark:border-neutral-800',
                  isDragging && 'opacity-40',
                  isDragOver && 'bg-primary-50/70 dark:bg-primary-900/20 ring-2 ring-inset ring-primary-400'
                )}
              >
                <span
                  className="mt-0.5 cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 hover:text-primary-500 shrink-0"
                  title="Arrastrá para reordenar"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <Icon className="h-4 w-4 shrink-0 text-primary-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')  saveEdit(item)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full rounded-lg border border-primary-400 bg-white dark:bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  ) : (
                    <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{item.titulo}</p>
                  )}
                  {!isEditing && fileBasename && (
                    <p className="mt-0.5 truncate text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{fileBasename}</p>
                  )}
                </div>
                {item.duracion_segundos && !isEditing && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatSeconds(item.duracion_segundos)}
                  </span>
                )}
                {!isEditing && (
                  <span className="hidden md:inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5">
                    <Hash className="h-3 w-3" />
                    {item.orden}
                  </span>
                )}
                <div className="flex gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(item)}
                        disabled={isSaving}
                        title="Guardar"
                        className="rounded-lg p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        title="Cancelar"
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        title="Editar título"
                        className="rounded-lg p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                        title="Eliminar"
                        className="rounded-lg p-1.5 text-neutral-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowUpload(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Subir {tipoLabel.toLowerCase()}
              </h3>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Capítulo — optional for video, required for audio/pdf */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Capítulo{tipo === 'video' && <span className="ml-1 text-neutral-400 font-normal">(opcional)</span>}
                </label>
                <select
                  value={formCapituloId}
                  onChange={(e) => setFormCapituloId(e.target.value)}
                  required={tipo !== 'video'}
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm cursor-pointer"
                >
                  <option value="">{tipo === 'video' ? 'Sin capítulo (General)' : 'Elegí un capítulo'}</option>
                  {capitulos.slice().sort((a, b) => a.numero - b.numero).map((c) => (
                    <option key={c.id} value={c.id}>Cap. {c.numero} — {c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Título */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Título</label>
                <input
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  required
                  placeholder={tipo === 'audio' ? 'Ej: Plan de Negocios' : 'Ej: Introducción al examen'}
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                />
              </div>

              {/* Upload mode */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Archivo</label>
                <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium cursor-pointer transition-colors',
                      uploadMode === 'upload' ? 'bg-primary-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Subir archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium cursor-pointer transition-colors',
                      uploadMode === 'url' ? 'bg-primary-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    )}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Pegar URL
                  </button>
                </div>
                {uploadMode === 'upload' ? (
                  <FileUploader
                    tipo={tipo}
                    folder={uploadFolder}
                    onUploadComplete={(url) => setUploadedUrl(url)}
                    currentUrl={uploadedUrl}
                  />
                ) : (
                  <input
                    value={uploadedUrl}
                    onChange={(e) => setUploadedUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Duración (seg)</label>
                  <input
                    value={formDuracion}
                    onChange={(e) => setFormDuracion(e.target.value)}
                    type="number" min="0" placeholder="300"
                    className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Orden</label>
                  <input
                    value={formOrden}
                    onChange={(e) => setFormOrden(e.target.value)}
                    type="number"
                    className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <p className="mt-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-2.5 text-sm text-danger-600 dark:text-danger-400">
                {formError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Subiendo...' : `Crear ${tipoLabel.toLowerCase()}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
