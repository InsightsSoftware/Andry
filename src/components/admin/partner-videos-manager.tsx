'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  Play,
} from 'lucide-react'
import {
  createPartnerVideo,
  updatePartnerVideo,
  deletePartnerVideo,
  reorderPartnerVideos,
} from '@/actions/partner-videos'
import { FileUploader } from '@/components/admin/file-uploader'
import { extractPath } from '@/lib/supabase/storage'
import type { Partner, PartnerVideo } from '@/types/database'

function youtubeThumb(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/)
  return m?.[1] ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
}

interface Props {
  partner: Partner
  initialVideos: PartnerVideo[]
  onClose: () => void
}

interface VideoForm {
  titulo: string
  descripcion: string
  video_url: string
}

const EMPTY: VideoForm = { titulo: '', descripcion: '', video_url: '' }

export function PartnerVideosManager({ partner, initialVideos, onClose }: Props) {
  const router = useRouter()
  const [videos, setVideos] = useState<PartnerVideo[]>(
    [...initialVideos].sort((a, b) => a.orden - b.orden)
  )
  const [editing, setEditing] = useState<PartnerVideo | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<VideoForm>(EMPTY)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError(null)
    setShowForm(true)
  }

  function openEdit(v: PartnerVideo) {
    setEditing(v)
    setForm({
      titulo: v.titulo,
      descripcion: v.descripcion || '',
      video_url: v.video_url,
    })
    setError(null)
    setShowForm(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.video_url.trim()) {
      setError('Subí un MP4 o pegá una URL de video.')
      return
    }

    startTransition(async () => {
      if (editing) {
        const res = await updatePartnerVideo(editing.id, {
          partner_id: partner.id,
          titulo: form.titulo,
          descripcion: form.descripcion,
          video_url: form.video_url,
          orden: editing.orden,
        })
        if ('error' in res && res.error) return setError(res.error)
        setVideos((prev) =>
          prev.map((x) =>
            x.id === editing.id
              ? { ...x, titulo: form.titulo, descripcion: form.descripcion || null, video_url: form.video_url }
              : x
          )
        )
      } else {
        const res = await createPartnerVideo({
          partner_id: partner.id,
          titulo: form.titulo,
          descripcion: form.descripcion,
          video_url: form.video_url,
          orden: videos.length,
        })
        if ('error' in res && res.error) return setError(res.error)
        if ('video' in res && res.video) {
          setVideos((prev) => [...prev, res.video as PartnerVideo])
        }
      }
      setShowForm(false)
      setEditing(null)
      router.refresh()
    })
  }

  function handleDelete(v: PartnerVideo) {
    if (!confirm(`¿Eliminar el video "${v.titulo}"?`)) return
    startTransition(async () => {
      const res = await deletePartnerVideo(v.id)
      if ('error' in res && res.error) return alert(res.error)
      setVideos((prev) => prev.filter((x) => x.id !== v.id))
      router.refresh()
    })
  }

  function handleMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= videos.length) return
    const next = [...videos]
    ;[next[index], next[target]] = [next[target], next[index]]
    setVideos(next)
    startTransition(async () => {
      const res = await reorderPartnerVideos(next.map((v) => v.id))
      if ('error' in res && res.error) alert(res.error)
      router.refresh()
    })
  }

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Videos de {partner.nombre}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} · el orden define cuál es el principal
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Add button */}
          {!showForm && (
            <button
              onClick={openCreate}
              disabled={pending}
              className="mb-4 inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-accent-400 cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Agregar video
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form
              onSubmit={handleSave}
              className="mb-5 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40"
            >
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {editing ? 'Editar video' : 'Nuevo video'}
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  Título *
                </span>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  required
                  placeholder="Ej: Cómo solicitar tu crédito"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  Descripción
                </span>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  placeholder="Breve descripción del video (opcional)"
                  className={inputCls}
                />
              </label>
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  Video *
                </span>
                <FileUploader
                  tipo="video"
                  folder="partners"
                  currentUrl={form.video_url}
                  onUploadComplete={(signedUrl) => {
                    const path = signedUrl ? extractPath(signedUrl) : ''
                    setForm((f) => ({ ...f, video_url: path }))
                  }}
                />
                <div className="my-2 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                  <span>o pegá una URL de YouTube</span>
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                </div>
                <input
                  type="text"
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... o partners/video.mp4"
                  className={inputCls}
                />
              </div>

              {error && (
                <p className="rounded-lg border border-danger-200 bg-danger-50 p-2 text-xs text-danger-600 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-400">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); setError(null) }}
                  disabled={pending}
                  className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-accent-400 cursor-pointer disabled:opacity-50"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Guardar' : 'Agregar'}
                </button>
              </div>
            </form>
          )}

          {/* Video list */}
          {videos.length === 0 && !showForm ? (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center dark:border-neutral-700">
              <Play className="mx-auto mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Esta empresa todavía no tiene videos. Agregá el primero.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {videos.map((v, i) => {
                const thumb = youtubeThumb(v.video_url)
                return (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2 dark:border-neutral-700"
                  >
                    {/* Order controls */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(i, -1)}
                        disabled={pending || i === 0}
                        className="rounded p-0.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 dark:hover:text-neutral-200 cursor-pointer"
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(i, 1)}
                        disabled={pending || i === videos.length - 1}
                        className="rounded p-0.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 dark:hover:text-neutral-200 cursor-pointer"
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Thumb */}
                    <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-800 to-accent-900">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </div>
                      )}
                      {i === 0 && (
                        <span className="absolute bottom-0.5 left-0.5 rounded bg-accent-500 px-1 text-[8px] font-bold text-neutral-900">
                          PRINCIPAL
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {v.titulo}
                      </p>
                      <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {v.descripcion || v.video_url}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(v)}
                        disabled={pending}
                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        disabled={pending}
                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/30 dark:hover:text-danger-400 cursor-pointer disabled:opacity-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20'
