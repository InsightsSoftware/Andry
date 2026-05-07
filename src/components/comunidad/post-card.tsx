'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  Award,
  ImagePlus,
  X,
  Loader2,
  Trash2,
  Star,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createComment,
  markResuelto,
  deletePost,
  deleteComment,
  removePostMedia,
  toggleComentarioDestacado,
  setPostResuelto,
} from '@/actions/comunidad'
import { AvatarInicial } from './avatar-inicial'

interface Profile {
  nombre_completo: string
  avatar_url?: string | null
  es_mentor?: boolean | null
  oficio?: string | null
  ubicacion?: string | null
}

interface Comment {
  id: string
  contenido: string
  imagen_url?: string | null
  created_at: string
  destacado?: boolean
  profiles: Profile | null
}

interface Post {
  id: string
  user_id: string
  titulo: string
  contenido: string
  tipo: 'duda' | 'trabajo'
  ubicacion: string | null
  presupuesto: string | null
  resuelto: boolean
  created_at: string
  media_urls?: string[] | null
  profiles: Profile | null
  comentarios: Comment[]
}

const OFICIO_LABELS: Record<string, string> = {
  electricidad: 'Electricidad',
  plomeria: 'Plomería',
  hvac: 'HVAC',
  general: 'Contratista general',
  finanzas: 'Finanzas',
  legal: 'Legal',
  estructura: 'Estructura',
  techos: 'Techos',
  pintura: 'Pintura',
}

function MentorBadge({ profile }: { profile: Profile | null | undefined }) {
  if (!profile?.es_mentor) return null
  const oficio = profile.oficio ? OFICIO_LABELS[profile.oficio] : null
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-400/40 bg-accent-500/10 px-2 py-0.5 text-[10px] font-semibold text-accent-500 dark:text-accent-400">
      <Award className="h-2.5 w-2.5 fill-current" />
      Mentor{oficio ? ` · ${oficio}` : ''}
    </span>
  )
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  )
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

interface PostCardProps {
  post: Post
  currentUserId?: string
  isAdmin?: boolean
}

export function PostCard({ post, currentUserId, isAdmin }: PostCardProps) {
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentImage, setCommentImage] = useState<{ previewUrl: string; remoteUrl: string | null; uploading: boolean } | null>(null)
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resuelto, setResuelto] = useState(post.resuelto)

  // Admin state
  const [deleted, setDeleted] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [localMedia, setLocalMedia] = useState(post.media_urls ?? [])
  const [localComments, setLocalComments] = useState(post.comentarios ?? [])
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [togglingCommentId, setTogglingCommentId] = useState<string | null>(null)
  const [removingMedia, setRemovingMedia] = useState<string | null>(null)

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  const VIDEO_EXTS = ['.mp4', '.mov', '.webm']
  const mediaImages = localMedia.filter((u) => !VIDEO_EXTS.some((e) => u.toLowerCase().includes(e)))
  const mediaVideos = localMedia.filter((u) => VIDEO_EXTS.some((e) => u.toLowerCase().includes(e)))

  const canResolve = !resuelto && (currentUserId === post.user_id || isAdmin)

  if (deleted) return null

  async function handleMarkResuelto() {
    setResolving(true)
    const result = await markResuelto(post.id)
    if (result.error) setError(result.error)
    else setResuelto(true)
    setResolving(false)
  }

  async function handleUnmarkResuelto() {
    setResolving(true)
    const result = await setPostResuelto(post.id, false)
    if (result.error) setError(result.error)
    else setResuelto(false)
    setResolving(false)
  }

  async function handleDeletePost() {
    if (!confirm('¿Eliminar este post? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    const result = await deletePost(post.id)
    if (result.error) {
      setError(result.error)
      setDeleting(false)
    } else {
      setDeleted(true)
      router.refresh()
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('¿Eliminar este comentario?')) return
    setDeletingCommentId(commentId)
    const result = await deleteComment(commentId)
    if (result.error) setError(result.error)
    else setLocalComments((prev) => prev.filter((c) => c.id !== commentId))
    setDeletingCommentId(null)
  }

  async function handleToggleDestacado(comment: Comment) {
    setTogglingCommentId(comment.id)
    const next = !comment.destacado
    const result = await toggleComentarioDestacado(comment.id, next)
    if (result.error) setError(result.error)
    else setLocalComments((prev) =>
      prev.map((c) => c.id === comment.id ? { ...c, destacado: next } : c)
    )
    setTogglingCommentId(null)
  }

  async function handleRemoveMedia(url: string) {
    setRemovingMedia(url)
    const result = await removePostMedia(post.id, url)
    if (result.error) setError(result.error)
    else setLocalMedia((prev) => prev.filter((u) => u !== url))
    setRemovingMedia(null)
  }

  async function handleCommentImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setCommentImage({ previewUrl, remoteUrl: null, uploading: true })

    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/comunidad/upload-media', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok || !data.url) {
      setCommentImage(null)
      setError('No se pudo subir la imagen. Intentalo de nuevo.')
      return
    }
    setCommentImage({ previewUrl, remoteUrl: data.url, uploading: false })
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (commentImage?.uploading) {
      setError('Esperá a que termine de subir la imagen.')
      return
    }

    setCommenting(true)

    const formData = new FormData()
    formData.set('post_id', post.id)
    formData.set('contenido', commentText)
    if (commentImage?.remoteUrl) formData.set('imagen_url', commentImage.remoteUrl)

    const result = await createComment(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setCommentText('')
      setCommentImage(null)
    }
    setCommenting(false)
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <AvatarInicial
          nombre={post.profiles?.nombre_completo}
          avatarUrl={post.profiles?.avatar_url}
          size="md"
          ring={!!post.profiles?.es_mentor}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
              {post.titulo}
            </h3>
            {resuelto ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-500/10 dark:bg-success-500/20 px-2 py-0.5 text-xs font-semibold text-success-600 dark:text-success-400">
                <CheckCircle className="h-3 w-3" />
                Resuelto
              </span>
            ) : canResolve ? (
              <button
                onClick={handleMarkResuelto}
                disabled={resolving}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success-400/40 bg-success-500/10 px-2 py-0.5 text-xs font-semibold text-success-600 dark:text-success-400 hover:bg-success-500/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="h-3 w-3" />
                {resolving ? 'Guardando…' : 'Marcar resuelto'}
              </button>
            ) : null}
            {/* Owner or admin: unmark resuelto */}
            {resuelto && (currentUserId === post.user_id || isAdmin) && (
              <button
                onClick={handleUnmarkResuelto}
                disabled={resolving}
                title="Desmarcar como resuelto"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-300 dark:border-neutral-600 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:border-warning-400 hover:text-warning-600 dark:hover:text-warning-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Desmarcar
              </button>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-400 dark:text-neutral-500">
            <span className="font-medium text-neutral-600 dark:text-neutral-400">
              {post.profiles?.nombre_completo || 'Usuario'}
            </span>
            <MentorBadge profile={post.profiles} />
            {post.profiles?.ubicacion && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {post.profiles.ubicacion}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {timeAgo(post.created_at)}
            </span>
          </div>
        </div>
        {/* Admin: delete post */}
        {isAdmin && (
          <button
            onClick={handleDeletePost}
            disabled={deleting}
            title="Eliminar post"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-danger-500 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Content */}
      <p className="mb-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
        {post.contenido}
      </p>

      {/* Media: images */}
      {mediaImages.length > 0 && (
        <div className={`mb-3 grid gap-1.5 ${
          mediaImages.length === 1
            ? 'grid-cols-1'
            : mediaImages.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-3'
        }`}>
          {mediaImages.map((url, i) => (
            <div key={i} className="relative group/img">
              <button
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="relative w-full overflow-hidden rounded-xl cursor-pointer group"
                style={{ aspectRatio: mediaImages.length === 1 ? '16/9' : '1/1', display: 'block' }}
              >
                <img
                  src={url}
                  alt={`Imagen ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </button>
              {/* Admin: remove image */}
              {isAdmin && (
                <button
                  onClick={() => handleRemoveMedia(url)}
                  disabled={removingMedia === url}
                  title="Eliminar imagen"
                  className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-danger-600 transition-colors cursor-pointer z-10 opacity-0 group-hover/img:opacity-100"
                >
                  {removingMedia === url
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <X className="h-3 w-3" />
                  }
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media: videos */}
      {mediaVideos.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {mediaVideos.map((url, i) => (
            <div key={i} className="relative group/vid">
              <video
                src={url}
                controls
                preload="metadata"
                className="w-full max-h-72 rounded-xl bg-neutral-900 object-contain"
              />
              {/* Admin: remove video */}
              {isAdmin && (
                <button
                  onClick={() => handleRemoveMedia(url)}
                  disabled={removingMedia === url}
                  title="Eliminar video"
                  className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-danger-600 transition-colors cursor-pointer opacity-0 group-hover/vid:opacity-100"
                >
                  {removingMedia === url
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <><X className="h-3 w-3" /> Eliminar</>
                  }
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer text-2xl font-light leading-none"
          >
            ×
          </button>
          <img
            src={lightboxUrl}
            alt="Imagen ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Job metadata */}
      {post.tipo === 'trabajo' && (post.ubicacion || post.presupuesto) && (
        <div className="mb-3 flex flex-wrap gap-3">
          {post.ubicacion && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400">
              <MapPin className="h-3 w-3" />
              {post.ubicacion}
            </span>
          )}
          {post.presupuesto && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400">
              <DollarSign className="h-3 w-3" />
              {post.presupuesto}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400"
      >
        <MessageCircle className="h-4 w-4" />
        {localComments?.length || 0} comentarios
      </button>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          {localComments?.map((comment) => (
            <div
              key={comment.id}
              className={`mb-3 flex gap-2.5 rounded-lg p-3 ${
                comment.destacado
                  ? 'bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800'
                  : 'bg-neutral-50 dark:bg-neutral-800'
              }`}
            >
              <AvatarInicial
                nombre={comment.profiles?.nombre_completo}
                avatarUrl={comment.profiles?.avatar_url}
                size="sm"
                ring={!!comment.profiles?.es_mentor}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">
                    {comment.profiles?.nombre_completo || 'Usuario'}
                  </span>
                  <MentorBadge profile={comment.profiles} />
                  {comment.destacado && (
                    <span className="inline-flex items-center gap-0.5 text-accent-600 dark:text-accent-400 font-semibold">
                      <Star className="h-3 w-3 fill-current" />
                      Destacado
                    </span>
                  )}
                  <span>·</span>
                  <span>{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                  {comment.contenido}
                </p>
                {comment.imagen_url && (
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(comment.imagen_url!)}
                    className="mt-2 block overflow-hidden rounded-xl cursor-pointer group"
                  >
                    <img
                      src={comment.imagen_url}
                      alt="Imagen adjunta"
                      className="max-h-48 w-auto rounded-xl object-cover transition-opacity group-hover:opacity-90"
                    />
                  </button>
                )}
              </div>
              {/* Admin: destacar + delete comment */}
              {isAdmin && (
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleDestacado(comment)}
                    disabled={togglingCommentId === comment.id}
                    title={comment.destacado ? 'Quitar destacado' : 'Destacar comentario'}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                      comment.destacado
                        ? 'text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/30'
                        : 'text-neutral-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/30'
                    }`}
                  >
                    {togglingCommentId === comment.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Star className={`h-3.5 w-3.5 ${comment.destacado ? 'fill-current' : ''}`} />
                    }
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingCommentId === comment.id}
                    title="Eliminar comentario"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingCommentId === comment.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              )}
            </div>
          ))}

          <form onSubmit={handleComment} className="mt-3 flex flex-col gap-2">
            {/* Image preview */}
            {commentImage && (
              <div className="relative inline-flex w-20 h-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                <img src={commentImage.previewUrl} alt="" className="h-full w-full object-cover" />
                {commentImage.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
                {!commentImage.uploading && (
                  <button
                    type="button"
                    onClick={() => setCommentImage(null)}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {/* Image picker button */}
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                disabled={!!commentImage}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Adjuntar imagen"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleCommentImagePick}
              />

              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/30"
                required
              />
              <Button size="sm" type="submit" loading={commenting}>
                Enviar
              </Button>
            </div>
          </form>
          {error && (
            <p className="mt-2 text-xs text-danger-500">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
