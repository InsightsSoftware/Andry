'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Upload,
  Link2,
  Clock,
  Video as VideoIcon,
  AlignLeft,
} from 'lucide-react'
import { createContent, updateContent, deleteContent } from '@/actions/admin'
import { FileUploader } from './file-uploader'
import { formatSeconds } from '@/lib/utils'

interface VideoItem {
  id: string
  titulo: string
  descripcion: string | null
  archivo_url: string
  duracion_segundos: number | null
  orden: number
  created_at: string
}

interface VideosManagerProps {
  items: VideoItem[]
}

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  archivo_url: '',
  duracion_segundos: '',
}

export function VideosManager({ items: initialItems }: VideosManagerProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<VideoItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setUploadMode('upload')
    setFormError('')
    setShowModal(true)
  }

  function openEdit(item: VideoItem) {
    setEditing(item)
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion ?? '',
      archivo_url: item.archivo_url,
      duracion_segundos: item.duracion_segundos ? String(item.duracion_segundos) : '',
    })
    setUploadMode('url')
    setFormError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const titulo = form.titulo.trim()
    const descripcion = form.descripcion.trim()
    const archivo_url = form.archivo_url.trim()

    if (!titulo) return setFormError('El título es obligatorio')
    if (!descripcion) return setFormError('La descripción es obligatoria')
    if (!archivo_url) return setFormError(uploadMode === 'upload' ? 'Subí un video' : 'Pegá una URL')

    setSubmitting(true)

    if (editing) {
      const res = await updateContent(editing.id, {
        titulo,
        descripcion,
        duracion_segundos: form.duracion_segundos ? Number(form.duracion_segundos) : null,
      })
      if (res?.error) {
        setFormError(res.error)
      } else {
        setItems((prev) =>
          prev.map((v) =>
            v.id === editing.id
              ? {
                  ...v,
                  titulo,
                  descripcion,
                  duracion_segundos: form.duracion_segundos ? Number(form.duracion_segundos) : null,
                }
              : v
          )
        )
        closeModal()
        router.refresh()
      }
    } else {
      const res = await createContent({
        capitulo_id: null,
        tipo: 'video',
        titulo,
        descripcion,
        archivo_url,
        duracion_segundos: form.duracion_segundos ? Number(form.duracion_segundos) : undefined,
        orden: 0,
      })
      if (res?.error) {
        setFormError(res.error)
      } else {
        closeModal()
        router.refresh()
      }
    }
    setSubmitting(false)
  }

  async function handleDelete(item: VideoItem) {
    if (!confirm(`¿Eliminar "${item.titulo}"? No se puede deshacer.`)) return
    setDeletingId(item.id)
    const res = await deleteContent(item.id)
    if (res?.error) alert(res.error)
    else {
      setItems((prev) => prev.filter((v) => v.id !== item.id))
      router.refresh()
    }
    setDeletingId(null)
  }

  return (
    <div>
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {items.length} video{items.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nuevo video
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-14 text-center">
          <VideoIcon className="mx-auto mb-3 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-4 text-neutral-500 dark:text-neutral-400">
            Todavía no hay videos. Subí el primero.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Subir video
          </button>
        </div>
      )}

      {/* Video list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const isDeleting = deletingId === item.id
            return (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
              >
                {/* Thumbnail placeholder */}
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  {item.archivo_url ? (
                    <video
                      src={`${item.archivo_url}#t=1`}
                      preload="metadata"
                      muted
                      playsInline
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <VideoIcon className="h-6 w-6 text-neutral-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {item.titulo}
                  </p>
                  {item.descripcion && (
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.descripcion}
                    </p>
                  )}
                  {item.duracion_segundos && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                      <Clock className="h-3 w-3" />
                      {formatSeconds(item.duracion_segundos)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    title="Editar"
                    className="rounded-lg p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isDeleting}
                    title="Eliminar"
                    className="rounded-lg p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {editing ? 'Editar video' : 'Nuevo video'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">

              {/* Título */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  Título <span className="text-danger-500">*</span>
                </span>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  required
                  placeholder="Ej: Cómo calcular el presupuesto de una obra"
                  className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>

              {/* Descripción */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  <AlignLeft className="h-3.5 w-3.5" />
                  Descripción <span className="text-danger-500">*</span>
                </span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Describí de qué trata el video, qué van a aprender, temas que cubre..."
                  className="block w-full resize-none rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>

              {/* Archivo — solo al crear */}
              {!editing && (
                <div>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    Video <span className="text-danger-500">*</span>
                  </span>

                  {/* Upload / URL toggle */}
                  <div className="flex overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 mb-3">
                    <button
                      type="button"
                      onClick={() => setUploadMode('upload')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        uploadMode === 'upload'
                          ? 'bg-primary-600 text-white'
                          : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Subir archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        uploadMode === 'url'
                          ? 'bg-primary-600 text-white'
                          : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Pegar URL
                    </button>
                  </div>

                  {uploadMode === 'upload' ? (
                    <FileUploader
                      tipo="video"
                      folder="videos"
                      onUploadComplete={(url) => setForm((f) => ({ ...f, archivo_url: url }))}
                      currentUrl={form.archivo_url}
                    />
                  ) : (
                    <input
                      type="text"
                      value={form.archivo_url}
                      onChange={(e) => setForm((f) => ({ ...f, archivo_url: e.target.value }))}
                      placeholder="https://... o ruta de storage"
                      className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  )}
                </div>
              )}

              {/* Duración */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  Duración (segundos) <span className="text-neutral-400 font-normal normal-case">— opcional</span>
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.duracion_segundos}
                  onChange={(e) => setForm((f) => ({ ...f, duracion_segundos: e.target.value }))}
                  placeholder="Ej: 300 = 5 min"
                  className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>

              {formError && (
                <p className="rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 px-3 py-2.5 text-sm text-danger-600 dark:text-danger-400">
                  {formError}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Subir video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
