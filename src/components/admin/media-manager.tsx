'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Headphones,
  Video as VideoIcon,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Plus,
  Upload,
  Link2,
  BookOpen,
  Clock,
  Hash,
} from 'lucide-react'
import {
  updateContent,
  deleteContent,
  createContent,
} from '@/actions/admin'
import { FileUploader } from './file-uploader'
import { formatSeconds, cn } from '@/lib/utils'

export interface MediaItem {
  id: string
  capitulo_id: string
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
  tipo: 'audio' | 'video'
  items: MediaItem[]
  capitulos: MediaCapitulo[]
  cursos: MediaCurso[]
}

export function MediaManager({ tipo, items, capitulos, cursos }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<MediaItem[]>(items)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterCapId, setFilterCapId] = useState<string>('')

  // Upload modal
  const [showUpload, setShowUpload] = useState(false)
  const [formCapituloId, setFormCapituloId] = useState<string>(
    capitulos[0]?.id ?? ''
  )
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload')
  const [formTitulo, setFormTitulo] = useState('')
  const [formDuracion, setFormDuracion] = useState('')
  const [formOrden, setFormOrden] = useState('0')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const capMap = useMemo(() => new Map(capitulos.map((c) => [c.id, c])), [capitulos])
  const cursoMap = useMemo(() => new Map(cursos.map((c) => [c.id, c])), [cursos])

  const filtered = useMemo(() => {
    if (!filterCapId) return rows
    return rows.filter((r) => r.capitulo_id === filterCapId)
  }, [rows, filterCapId])

  const Icon = tipo === 'audio' ? Headphones : VideoIcon
  const tipoLabel = tipo === 'audio' ? 'Audio' : 'Video'

  // Group by capítulo for rendering (sorted)
  const grouped = useMemo(() => {
    const m = new Map<string, MediaItem[]>()
    for (const r of filtered) {
      const arr = m.get(r.capitulo_id) ?? []
      arr.push(r)
      m.set(r.capitulo_id, arr)
    }
    // Sort each group by orden
    for (const arr of m.values()) arr.sort((a, b) => a.orden - b.orden)
    // Return as list ordered by capítulo numero
    return Array.from(m.entries())
      .map(([capId, rows]) => ({ capId, cap: capMap.get(capId), rows }))
      .sort((a, b) => (a.cap?.numero ?? 0) - (b.cap?.numero ?? 0))
  }, [filtered, capMap])

  // ── Handlers ──────────────────────────────────────────────

  function startEdit(item: MediaItem) {
    setEditingId(item.id)
    setEditTitle(item.titulo)
  }

  async function saveEdit(item: MediaItem) {
    const t = editTitle.trim()
    if (!t || t === item.titulo) {
      setEditingId(null)
      return
    }
    setSavingId(item.id)
    const res = await updateContent(item.id, { titulo: t })
    if (res && 'error' in res && res.error) {
      alert(res.error)
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, titulo: t } : r))
      )
      setEditingId(null)
      router.refresh()
    }
    setSavingId(null)
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`¿Eliminar "${item.titulo}"?`)) return
    setDeletingId(item.id)
    const res = await deleteContent(item.id)
    if (res?.error) {
      alert(res.error)
    } else {
      setRows((prev) => prev.filter((r) => r.id !== item.id))
      router.refresh()
    }
    setDeletingId(null)
  }

  function openUpload() {
    setUploadedUrl('')
    setFormTitulo('')
    setFormDuracion('')
    setFormOrden('0')
    setFormError('')
    setUploadMode('upload')
    if (!formCapituloId) setFormCapituloId(capitulos[0]?.id ?? '')
    setShowUpload(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const titulo = formTitulo.trim()
    if (!titulo) return setFormError('Falta el título')
    if (!formCapituloId) return setFormError('Elegí un capítulo')
    const archivoUrl = uploadedUrl.trim()
    if (!archivoUrl)
      return setFormError(
        uploadMode === 'upload' ? 'Subí un archivo' : 'Pegá una URL'
      )

    setSubmitting(true)
    const res = await createContent({
      capitulo_id: formCapituloId,
      tipo,
      titulo,
      archivo_url: archivoUrl,
      duracion_segundos: Number(formDuracion) || undefined,
      orden: Number(formOrden) || 0,
    })
    if (res.error) {
      setFormError(res.error)
    } else {
      setShowUpload(false)
      router.refresh()
    }
    setSubmitting(false)
  }

  // Build folder path for storage: cursoSlug/capitulo-NN/
  const targetCap = capMap.get(formCapituloId)
  const targetCurso = targetCap ? cursoMap.get(targetCap.curso_id) : null
  const uploadFolder =
    targetCurso && targetCap
      ? `${targetCurso.slug}/capitulo-${String(targetCap.numero).padStart(2, '0')}`
      : 'general'

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary-500" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {rows.length} {tipoLabel.toLowerCase()}
            {rows.length === 1 ? '' : 's'} en total
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={filterCapId}
            onChange={(e) => setFilterCapId(e.target.value)}
            className="rounded-xl glass-input px-3 py-2 text-sm cursor-pointer"
          >
            <option value="">Todos los capítulos</option>
            {capitulos
              .slice()
              .sort((a, b) => a.numero - b.numero)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  Cap. {c.numero} — {c.nombre}
                </option>
              ))}
          </select>
          <button
            onClick={openUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Subir {tipoLabel.toLowerCase()}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Icon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-3 text-neutral-500 dark:text-neutral-400">
            {rows.length === 0
              ? `Todavía no hay ${tipoLabel.toLowerCase()}s.`
              : 'Sin resultados para este capítulo.'}
          </p>
          {rows.length === 0 && (
            <button
              onClick={openUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Subir el primero
            </button>
          )}
        </div>
      )}

      {/* Grouped list */}
      {grouped.map(({ capId, cap, rows }) => (
        <section key={capId}>
          <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <BookOpen className="h-3.5 w-3.5" />
            {cap ? `Cap. ${cap.numero} — ${cap.nombre}` : 'Sin capítulo'}
            <span className="ml-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold">
              {rows.length}
            </span>
          </h2>

          <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            {rows.map((item, i) => {
              const isEditing = editingId === item.id
              const isSaving = savingId === item.id
              const isDeleting = deletingId === item.id
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm',
                    i !== 0 && 'border-t border-neutral-100 dark:border-neutral-800'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary-500" />

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(item)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 min-w-0 rounded-lg border border-primary-400 bg-white dark:bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  ) : (
                    <span className="flex-1 min-w-0 truncate font-medium text-neutral-900 dark:text-neutral-100">
                      {item.titulo}
                    </span>
                  )}

                  {item.duracion_segundos && !isEditing && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatSeconds(item.duracion_segundos)}
                    </span>
                  )}

                  {!isEditing && (
                    <span className="hidden md:inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
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
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
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
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

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
              {/* Capítulo */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Capítulo
                </label>
                <select
                  value={formCapituloId}
                  onChange={(e) => setFormCapituloId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm cursor-pointer"
                >
                  <option value="">Elegí un capítulo</option>
                  {capitulos
                    .slice()
                    .sort((a, b) => a.numero - b.numero)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Cap. {c.numero} — {c.nombre}
                      </option>
                    ))}
                </select>
              </div>

              {/* Título */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Título
                </label>
                <input
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  required
                  placeholder={
                    tipo === 'audio'
                      ? 'Ej: Plan de Negocios'
                      : 'Ej: Introducción al examen'
                  }
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                />
              </div>

              {/* Upload mode */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                  Archivo
                </label>
                <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium cursor-pointer transition-colors',
                      uploadMode === 'upload'
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
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
                      uploadMode === 'url'
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
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
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Duración (seg)
                  </label>
                  <input
                    value={formDuracion}
                    onChange={(e) => setFormDuracion(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="300"
                    className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Orden
                  </label>
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
