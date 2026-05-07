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
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  MoveRight,
  Check,
} from 'lucide-react'
import { createContent, updateContent, deleteContent } from '@/actions/admin'
import {
  createVideoCategoria,
  updateVideoCategoria,
  deleteVideoCategoria,
  assignVideoToCategoria,
} from '@/actions/video-categorias'
import { FileUploader } from './file-uploader'
import { formatSeconds } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────

export interface VideoCategoria {
  id: string
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  orden: number
  activo: boolean
}

export interface VideoItem {
  id: string
  titulo: string
  descripcion: string | null
  archivo_url: string
  duracion_segundos: number | null
  orden: number
  video_categoria_id: string | null
  created_at: string
}

interface VideosManagerProps {
  categorias: VideoCategoria[]
  videos: VideoItem[]
}

// ── Form defaults ──────────────────────────────────────────────────

const EMPTY_VIDEO_FORM = {
  titulo: '',
  descripcion: '',
  archivo_url: '',
  duracion_segundos: '',
}

const EMPTY_CAT_FORM = {
  nombre: '',
  descripcion: '',
  imagen_url: '',
}

// ══════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════

export function VideosManager({
  categorias: initialCategorias,
  videos: initialVideos,
}: VideosManagerProps) {
  const router = useRouter()

  // ── Global state ───────────────────────────────────────────────
  const [categorias, setCategorias] = useState(initialCategorias)
  const [videos, setVideos] = useState(initialVideos)

  // View: 'categorias' shows the category grid; 'videos' shows one category's list
  const [view, setView] = useState<'categorias' | 'videos'>('categorias')
  const [activeCatId, setActiveCatId] = useState<string | null>(null)

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<VideoCategoria | null>(null)
  const [catForm, setCatForm] = useState(EMPTY_CAT_FORM)
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [catError, setCatError] = useState('')
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null)

  // Video modal (create/edit)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null)
  const [videoForm, setVideoForm] = useState(EMPTY_VIDEO_FORM)
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload')
  const [videoSubmitting, setVideoSubmitting] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null)

  // Assign video to a different category (dropdown)
  const [assigningVideoId, setAssigningVideoId] = useState<string | null>(null)

  // ── Derived data ───────────────────────────────────────────────
  const activeCat = activeCatId
    ? categorias.find((c) => c.id === activeCatId) ?? null
    : null

  const videosInCategory = activeCatId
    ? videos.filter((v) => v.video_categoria_id === activeCatId)
    : []
  const videosUncategorized = videos.filter((v) => v.video_categoria_id === null)

  // ── Navigation ─────────────────────────────────────────────────
  function openCategory(cat: VideoCategoria) {
    setActiveCatId(cat.id)
    setView('videos')
  }

  function backToCategories() {
    setView('categorias')
    setActiveCatId(null)
  }

  // ── Category modal ─────────────────────────────────────────────
  function openCreateCat() {
    setEditingCat(null)
    setCatForm(EMPTY_CAT_FORM)
    setCatError('')
    setShowCatModal(true)
  }

  function openEditCat(cat: VideoCategoria) {
    setEditingCat(cat)
    setCatForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion ?? '',
      imagen_url: cat.imagen_url ?? '',
    })
    setCatError('')
    setShowCatModal(true)
  }

  function closeCatModal() {
    setShowCatModal(false)
    setEditingCat(null)
    setCatError('')
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCatError('')
    const nombre = catForm.nombre.trim()
    if (!nombre) return setCatError('El nombre es obligatorio')

    setCatSubmitting(true)

    if (editingCat) {
      const res = await updateVideoCategoria(editingCat.id, {
        nombre,
        descripcion: catForm.descripcion,
        imagen_url: catForm.imagen_url || undefined,
      })
      if (res?.error) {
        setCatError(res.error)
      } else {
        setCategorias((prev) =>
          prev.map((c) =>
            c.id === editingCat.id
              ? {
                  ...c,
                  nombre,
                  descripcion: catForm.descripcion || null,
                  imagen_url: catForm.imagen_url || null,
                }
              : c
          )
        )
        closeCatModal()
        router.refresh()
      }
    } else {
      const res = await createVideoCategoria({
        nombre,
        descripcion: catForm.descripcion,
        imagen_url: catForm.imagen_url || undefined,
        orden: categorias.length,
      })
      if (res?.error) {
        setCatError(res.error)
      } else {
        closeCatModal()
        router.refresh()
      }
    }
    setCatSubmitting(false)
  }

  async function handleDeleteCat(cat: VideoCategoria) {
    const count = videos.filter((v) => v.video_categoria_id === cat.id).length
    const msg =
      count > 0
        ? `¿Eliminar "${cat.nombre}"? Los ${count} video${count !== 1 ? 's' : ''} van a quedar sin categoría. No se puede deshacer.`
        : `¿Eliminar "${cat.nombre}"? No se puede deshacer.`
    if (!confirm(msg)) return
    setDeletingCatId(cat.id)
    const res = await deleteVideoCategoria(cat.id)
    if (res?.error) {
      alert(res.error)
    } else {
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id))
      setVideos((prev) =>
        prev.map((v) =>
          v.video_categoria_id === cat.id ? { ...v, video_categoria_id: null } : v
        )
      )
      if (activeCatId === cat.id) backToCategories()
      router.refresh()
    }
    setDeletingCatId(null)
  }

  // ── Video modal ────────────────────────────────────────────────
  function openCreateVideo() {
    setEditingVideo(null)
    setVideoForm(EMPTY_VIDEO_FORM)
    setUploadMode('upload')
    setVideoError('')
    setShowVideoModal(true)
  }

  function openEditVideo(video: VideoItem) {
    setEditingVideo(video)
    setVideoForm({
      titulo: video.titulo,
      descripcion: video.descripcion ?? '',
      archivo_url: video.archivo_url,
      duracion_segundos: video.duracion_segundos ? String(video.duracion_segundos) : '',
    })
    setUploadMode('url')
    setVideoError('')
    setShowVideoModal(true)
  }

  function closeVideoModal() {
    setShowVideoModal(false)
    setEditingVideo(null)
    setVideoError('')
  }

  async function handleVideoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setVideoError('')

    const titulo = videoForm.titulo.trim()
    const descripcion = videoForm.descripcion.trim()
    const archivo_url = videoForm.archivo_url.trim()

    if (!titulo) return setVideoError('El título es obligatorio')
    if (!descripcion) return setVideoError('La descripción es obligatoria')
    if (!archivo_url)
      return setVideoError(
        uploadMode === 'upload' ? 'Subí un video' : 'Pegá una URL'
      )

    setVideoSubmitting(true)

    if (editingVideo) {
      const res = await updateContent(editingVideo.id, {
        titulo,
        descripcion,
        duracion_segundos: videoForm.duracion_segundos
          ? Number(videoForm.duracion_segundos)
          : null,
      })
      if (res?.error) {
        setVideoError(res.error)
      } else {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === editingVideo.id
              ? {
                  ...v,
                  titulo,
                  descripcion,
                  duracion_segundos: videoForm.duracion_segundos
                    ? Number(videoForm.duracion_segundos)
                    : null,
                }
              : v
          )
        )
        closeVideoModal()
        router.refresh()
      }
    } else {
      // Create — assign to active category automatically
      const res = await createContent({
        capitulo_id: null,
        tipo: 'video',
        titulo,
        descripcion,
        archivo_url,
        duracion_segundos: videoForm.duracion_segundos
          ? Number(videoForm.duracion_segundos)
          : undefined,
        orden: 0,
        video_categoria_id: activeCatId ?? null,
      })
      if (res?.error) {
        setVideoError(res.error)
      } else {
        closeVideoModal()
        router.refresh()
      }
    }
    setVideoSubmitting(false)
  }

  async function handleDeleteVideo(video: VideoItem) {
    if (!confirm(`¿Eliminar "${video.titulo}"? No se puede deshacer.`)) return
    setDeletingVideoId(video.id)
    const res = await deleteContent(video.id)
    if (res?.error) alert(res.error)
    else {
      setVideos((prev) => prev.filter((v) => v.id !== video.id))
      router.refresh()
    }
    setDeletingVideoId(null)
  }

  // ── Assign video to category ───────────────────────────────────
  async function handleAssignVideo(
    video: VideoItem,
    targetCatId: string | null
  ) {
    setAssigningVideoId(video.id)
    const res = await assignVideoToCategoria(video.id, targetCatId)
    if (res?.error) {
      alert(res.error)
    } else {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id ? { ...v, video_categoria_id: targetCatId } : v
        )
      )
      router.refresh()
    }
    setAssigningVideoId(null)
  }

  // ══════════════════════════════════════════════════════════════
  // Render: CATEGORIES view
  // ══════════════════════════════════════════════════════════════
  if (view === 'categorias') {
    return (
      <div>
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {categorias.length} categoría{categorias.length !== 1 ? 's' : ''}
            {videosUncategorized.length > 0 && (
              <span className="ml-2 text-warning-500">
                · {videosUncategorized.length} sin categoría
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateCat}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nueva categoría
            </button>
          </div>
        </div>

        {/* Empty state */}
        {categorias.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-14 text-center">
            <FolderOpen className="mx-auto mb-3 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="mb-4 text-neutral-500 dark:text-neutral-400">
              Todavía no hay categorías. Creá la primera.
            </p>
            <button
              onClick={openCreateCat}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Crear categoría
            </button>
          </div>
        )}

        {/* Category cards grid */}
        {categorias.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorias
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((cat) => {
                const count = videos.filter(
                  (v) => v.video_categoria_id === cat.id
                ).length
                const isDeleting = deletingCatId === cat.id
                return (
                  <div
                    key={cat.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  >
                    {/* Thumbnail area */}
                    <div
                      className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-500/10 to-neutral-100 dark:from-primary-900/30 dark:to-neutral-800 cursor-pointer"
                      onClick={() => openCategory(cat)}
                    >
                      {cat.imagen_url ? (
                        <img
                          src={cat.imagen_url}
                          alt={cat.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FolderOpen className="h-12 w-12 text-primary-400/60" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>

                    {/* Info + actions */}
                    <div className="flex flex-1 items-start justify-between gap-3 p-4">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => openCategory(cat)}
                      >
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {cat.nombre}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {count} video{count !== 1 ? 's' : ''}
                        </p>
                        {cat.descripcion && (
                          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 line-clamp-2">
                            {cat.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditCat(cat)}
                          title="Editar"
                          className="rounded-lg p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCat(cat)}
                          disabled={isDeleting}
                          title="Eliminar"
                          className="rounded-lg p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openCategory(cat)}
                          title="Ver videos"
                          className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Uncategorized videos section */}
        {videosUncategorized.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-700 dark:text-neutral-300">
                Videos sin categoría
              </h2>
              <button
                onClick={openCreateVideo}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo video
              </button>
            </div>
            <VideoList
              videos={videosUncategorized}
              categorias={categorias}
              activeCatId={null}
              onEdit={openEditVideo}
              onDelete={handleDeleteVideo}
              onAssign={handleAssignVideo}
              assigningVideoId={assigningVideoId}
              deletingVideoId={deletingVideoId}
            />
          </div>
        )}

        {/* Category modal */}
        <CategoryModal
          show={showCatModal}
          editing={editingCat}
          form={catForm}
          setForm={setCatForm}
          error={catError}
          submitting={catSubmitting}
          onSubmit={handleCatSubmit}
          onClose={closeCatModal}
        />

        {/* Video modal — also needed here for editing uncategorized videos */}
        <VideoModal
          show={showVideoModal}
          editing={editingVideo}
          form={videoForm}
          setForm={setVideoForm}
          uploadMode={uploadMode}
          setUploadMode={setUploadMode}
          error={videoError}
          submitting={videoSubmitting}
          onSubmit={handleVideoSubmit}
          onClose={closeVideoModal}
        />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // Render: VIDEOS view (single category)
  // ══════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Header with back button */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={backToCategories}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Categorías
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {activeCat?.nombre ?? 'Categoría'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {videosInCategory.length} video{videosInCategory.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreateVideo}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nuevo video
        </button>
      </div>

      {/* Video list for this category */}
      {videosInCategory.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            Esta categoría no tiene videos todavía.
          </p>
          <button
            onClick={openCreateVideo}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Agregar video
          </button>
        </div>
      ) : (
        <VideoList
          videos={videosInCategory}
          categorias={categorias}
          activeCatId={activeCatId}
          onEdit={openEditVideo}
          onDelete={handleDeleteVideo}
          onAssign={handleAssignVideo}
          assigningVideoId={assigningVideoId}
          deletingVideoId={deletingVideoId}
        />
      )}

      {/* Uncategorized videos that can be moved here */}
      {videosUncategorized.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Videos sin categoría — mover a esta
          </p>
          <div className="flex flex-col gap-2">
            {videosUncategorized.map((video) => {
              const isAssigning = assigningVideoId === video.id
              return (
                <div
                  key={video.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3"
                >
                  <VideoIcon className="h-5 w-5 shrink-0 text-neutral-400" />
                  <p className="flex-1 min-w-0 truncate text-sm text-neutral-700 dark:text-neutral-300">
                    {video.titulo}
                  </p>
                  <button
                    onClick={() =>
                      activeCatId && handleAssignVideo(video, activeCatId)
                    }
                    disabled={isAssigning}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 dark:border-primary-700 px-2.5 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAssigning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MoveRight className="h-3.5 w-3.5" />
                    )}
                    Mover acá
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Video modal */}
      <VideoModal
        show={showVideoModal}
        editing={editingVideo}
        form={videoForm}
        setForm={setVideoForm}
        uploadMode={uploadMode}
        setUploadMode={setUploadMode}
        error={videoError}
        submitting={videoSubmitting}
        onSubmit={handleVideoSubmit}
        onClose={closeVideoModal}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// Sub-component: VideoList
// ══════════════════════════════════════════════════════════════════

function VideoList({
  videos,
  categorias,
  activeCatId,
  onEdit,
  onDelete,
  onAssign,
  assigningVideoId,
  deletingVideoId,
}: {
  videos: VideoItem[]
  categorias: VideoCategoria[]
  activeCatId: string | null
  onEdit: (v: VideoItem) => void
  onDelete: (v: VideoItem) => void
  onAssign: (v: VideoItem, catId: string | null) => void
  assigningVideoId: string | null
  deletingVideoId: string | null
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      {videos.map((item) => {
        const isDeleting = deletingVideoId === item.id
        const isAssigning = assigningVideoId === item.id
        const menuOpen = openMenuId === item.id

        return (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
          >
            {/* Thumbnail */}
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
              {/* Move to category dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenMenuId(menuOpen ? null : item.id)
                  }
                  disabled={isAssigning}
                  title="Mover a categoría"
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoveRight className="h-4 w-4" />
                  )}
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 top-8 z-20 min-w-[180px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
                      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        Mover a
                      </p>
                      {/* Option: remove from category */}
                      {item.video_categoria_id !== null && (
                        <button
                          onClick={() => {
                            setOpenMenuId(null)
                            onAssign(item, null)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          Sin categoría
                        </button>
                      )}
                      {categorias.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setOpenMenuId(null)
                            onAssign(item, cat.id)
                          }}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          <span className="truncate">{cat.nombre}</span>
                          {item.video_categoria_id === cat.id && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => onEdit(item)}
                title="Editar"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(item)}
                disabled={isDeleting}
                title="Eliminar"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// Sub-component: CategoryModal
// ══════════════════════════════════════════════════════════════════

function CategoryModal({
  show,
  editing,
  form,
  setForm,
  error,
  submitting,
  onSubmit,
  onClose,
}: {
  show: boolean
  editing: VideoCategoria | null
  form: typeof EMPTY_CAT_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_CAT_FORM>>
  error: string
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {editing ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Nombre <span className="text-danger-500">*</span>
            </span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              required
              placeholder="Ej: Preparación General"
              className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              <AlignLeft className="h-3.5 w-3.5" />
              Descripción
            </span>
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              rows={3}
              placeholder="De qué trata esta categoría..."
              className="block w-full resize-none rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Imagen de portada{' '}
              <span className="text-neutral-400 font-normal normal-case">— opcional</span>
            </span>
            <FileUploader
              tipo="image"
              folder="categorias-videos"
              onUploadComplete={(url) =>
                setForm((f) => ({ ...f, imagen_url: url }))
              }
              currentUrl={form.imagen_url}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 px-3 py-2.5 text-sm text-danger-600 dark:text-danger-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// Sub-component: VideoModal (create / edit a video)
// ══════════════════════════════════════════════════════════════════

function VideoModal({
  show,
  editing,
  form,
  setForm,
  uploadMode,
  setUploadMode,
  error,
  submitting,
  onSubmit,
  onClose,
}: {
  show: boolean
  editing: VideoItem | null
  form: typeof EMPTY_VIDEO_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_VIDEO_FORM>>
  uploadMode: 'upload' | 'url'
  setUploadMode: (m: 'upload' | 'url') => void
  error: string
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {editing ? 'Editar video' : 'Nuevo video'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          {/* Título */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Título <span className="text-danger-500">*</span>
            </span>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) =>
                setForm((f) => ({ ...f, titulo: e.target.value }))
              }
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
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              required
              rows={4}
              placeholder="Describí de qué trata el video..."
              className="block w-full resize-none rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          {/* Archivo — solo al crear */}
          {!editing && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Video <span className="text-danger-500">*</span>
              </span>
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
                  onUploadComplete={(url) =>
                    setForm((f) => ({ ...f, archivo_url: url }))
                  }
                  currentUrl={form.archivo_url}
                />
              ) : (
                <input
                  type="text"
                  value={form.archivo_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, archivo_url: e.target.value }))
                  }
                  placeholder="https://... o ruta de storage"
                  className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              )}
            </div>
          )}

          {/* Duración */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Duración (segundos){' '}
              <span className="text-neutral-400 font-normal normal-case">
                — opcional
              </span>
            </span>
            <input
              type="number"
              min="0"
              value={form.duracion_segundos}
              onChange={(e) =>
                setForm((f) => ({ ...f, duracion_segundos: e.target.value }))
              }
              placeholder="Ej: 300 = 5 min"
              className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 px-3 py-2.5 text-sm text-danger-600 dark:text-danger-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <button
              type="button"
              onClick={onClose}
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
  )
}
