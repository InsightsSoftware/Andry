'use client'

import { useState, useRef, useEffect } from 'react'
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
  RotateCcw,
  BadgeCheck,
  Heart,
  Users,
  Reply,
  Pin,
  PinOff,
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
  setResolucionComment,
  getResolucionComment,
  getCommentMediaUrls,
  toggleLike,
  toggleCommentLike,
  togglePinPost,
} from '@/actions/comunidad'
import { AvatarInicial } from './avatar-inicial'

interface Profile {
  nombre_completo: string
  avatar_url?: string | null
  es_mentor?: boolean | null
  oficio?: string | null
  ubicacion?: string | null
  rol?: string | null
}

interface Comment {
  id: string
  contenido: string
  imagen_url?: string | null
  created_at: string
  destacado?: boolean
  likes_count?: number
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
  pinned?: boolean
  created_at: string
  media_urls?: string[] | null
  likes_count?: number
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

function ComunidadBadge({ profile }: { profile: Profile | null | undefined }) {
  if (profile?.rol !== 'comunidad') return null
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
      <Users className="h-2.5 w-2.5" />
      Comunidad
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
  currentUserName?: string
  currentUserAvatar?: string
  isAdmin?: boolean
}

export function PostCard({ post, currentUserId, currentUserName, currentUserAvatar, isAdmin }: PostCardProps) {
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count ?? 0)
  const [isLiked, setIsLiked] = useState(false)
  const [likingPost, setLikingPost] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentImages, setCommentImages] = useState<{ previewUrl: string; remoteUrl: string | null; uploading: boolean }[]>([])
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resuelto, setResuelto] = useState(post.resuelto)

  // Admin state
  const [pinned, setPinned] = useState(post.pinned ?? false)
  const [pinning, setPinning] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [localMedia, setLocalMedia] = useState(post.media_urls ?? [])
  const [localComments, setLocalComments] = useState(post.comentarios ?? [])
  const [resolucionCommentId, setResolucionCommentId] = useState<string | null>(null)
  const [settingResolucion, setSettingResolucion] = useState<string | null>(null)
  const [commentMediaMap, setCommentMediaMap] = useState<Record<string, string[]>>({})
  const lazyLoadedRef = useRef(false)

  // Lazy-load extra comment data (resolucion + media_urls) on first open
  useEffect(() => {
    if (!showComments || lazyLoadedRef.current) return
    lazyLoadedRef.current = true

    // Load resolución
    getResolucionComment(post.id).then((id) => {
      if (id) setResolucionCommentId(id)
    })

    // Load media_urls for each comment that has images
    localComments.forEach((c) => {
      getCommentMediaUrls(c.id).then((urls) => {
        if (urls && urls.length > 0) {
          setCommentMediaMap((prev) => ({ ...prev, [c.id]: urls }))
        }
      })
    })
  }, [showComments])
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [togglingCommentId, setTogglingCommentId] = useState<string | null>(null)
  const [removingMedia, setRemovingMedia] = useState<string | null>(null)
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>(() => {
    const initial: Record<string, { count: number; liked: boolean }> = {}
    for (const c of post.comentarios ?? []) {
      if ((c.likes_count ?? 0) > 0) {
        initial[c.id] = { count: c.likes_count ?? 0, liked: false }
      }
    }
    return initial
  })
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxUrl) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [lightboxUrl])

  const VIDEO_EXTS = ['.mp4', '.mov', '.webm']
  const mediaImages = localMedia.filter((u) => !VIDEO_EXTS.some((e) => u.toLowerCase().includes(e)))
  const mediaVideos = localMedia.filter((u) => VIDEO_EXTS.some((e) => u.toLowerCase().includes(e)))

  const canResolve = !resuelto && (currentUserId === post.user_id || isAdmin)

  if (deleted) return null

  async function handleLike() {
    if (!currentUserId || likingPost) return
    setLikingPost(true)
    const optimisticLiked = !isLiked
    setIsLiked(optimisticLiked)
    setLikeCount((c) => optimisticLiked ? c + 1 : Math.max(0, c - 1))
    const result = await toggleLike(post.id)
    if (result.error) {
      // Rollback
      setIsLiked(!optimisticLiked)
      setLikeCount((c) => optimisticLiked ? Math.max(0, c - 1) : c + 1)
    } else {
      setIsLiked(result.liked)
      setLikeCount(result.count)
    }
    setLikingPost(false)
  }

  async function handleTogglePin() {
    setPinning(true)
    const result = await togglePinPost(post.id)
    if (!result.error) setPinned(result.pinned ?? !pinned)
    setPinning(false)
  }

  async function handleCommentLike(commentId: string) {
    if (!currentUserId || likingCommentId) return
    setLikingCommentId(commentId)
    const prev = commentLikes[commentId] ?? { count: 0, liked: false }
    const optimisticLiked = !prev.liked
    setCommentLikes((m) => ({
      ...m,
      [commentId]: { count: optimisticLiked ? prev.count + 1 : Math.max(0, prev.count - 1), liked: optimisticLiked },
    }))
    const result = await toggleCommentLike(commentId)
    if (result.error) {
      setCommentLikes((m) => ({ ...m, [commentId]: prev })) // rollback
    } else {
      setCommentLikes((m) => ({ ...m, [commentId]: { count: result.count, liked: result.liked } }))
    }
    setLikingCommentId(null)
  }

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

  async function handleSetResolucion(commentId: string) {
    const next = resolucionCommentId === commentId ? null : commentId
    setSettingResolucion(commentId)
    const result = await setResolucionComment(post.id, next)
    if (result.error) setError(result.error)
    else setResolucionCommentId(next)
    setSettingResolucion(null)
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
    if (commentImages.length >= 5) return

    const previewUrl = URL.createObjectURL(file)
    const idx = commentImages.length
    setCommentImages((prev) => [...prev, { previewUrl, remoteUrl: null, uploading: true }])

    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/comunidad/upload-media', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok || !data.url) {
      setCommentImages((prev) => prev.filter((_, i) => i !== idx))
      setError('No se pudo subir la imagen. Intentalo de nuevo.')
      return
    }
    setCommentImages((prev) =>
      prev.map((img, i) => i === idx ? { ...img, remoteUrl: data.url, uploading: false } : img)
    )
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (commentImages.some((img) => img.uploading)) {
      setError('Esperá a que terminen de subir todas las imágenes.')
      return
    }

    setCommenting(true)

    const formData = new FormData()
    formData.set('post_id', post.id)
    formData.set('contenido', commentText)
    commentImages.forEach((img, i) => {
      if (img.remoteUrl) formData.set(`media_url_${i}`, img.remoteUrl)
    })

    const result = await createComment(formData)

    if (result.error) {
      setError(result.error)
    } else {
      // Optimistic: show comment immediately without waiting for page refresh
      const optimistic: Comment = {
        id: `opt-${Date.now()}`,
        contenido: commentText,
        created_at: new Date().toISOString(),
        destacado: false,
        profiles: currentUserName
          ? { nombre_completo: currentUserName, avatar_url: currentUserAvatar ?? null }
          : null,
      }
      setLocalComments((prev) => [...prev, optimistic])
      setCommentText('')
      setCommentImages([])
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
            {pinned && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Pin className="h-2.5 w-2.5 fill-current" />
                Fijado
              </span>
            )}
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
            <ComunidadBadge profile={post.profiles} />
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
        {/* Admin: pin + delete */}
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={handleTogglePin}
              disabled={pinning}
              title={pinned ? 'Desfijar post' : 'Fijar post arriba'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                pinned
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              {pinning
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : pinned
                  ? <PinOff className="h-4 w-4" />
                  : <Pin className="h-4 w-4" />
              }
            </button>
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              title="Eliminar post"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-danger-500 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="mb-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
        {post.contenido}
      </p>

      {/* Media: images + videos — small squares, Facebook style */}
      {(mediaImages.length > 0 || mediaVideos.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {/* Images */}
          {mediaImages.map((url, i) => (
            <div key={`img-${i}`} className="relative group/img shrink-0">
              <button
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="block h-16 w-16 overflow-hidden rounded-lg cursor-zoom-in"
              >
                <img
                  src={url}
                  alt={`Imagen ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                />
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleRemoveMedia(url)}
                  disabled={removingMedia === url}
                  title="Eliminar imagen"
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-danger-600 transition-colors cursor-pointer z-10 opacity-0 group-hover/img:opacity-100"
                >
                  {removingMedia === url
                    ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    : <X className="h-2.5 w-2.5" />
                  }
                </button>
              )}
            </div>
          ))}
          {/* Videos — same small squares */}
          {mediaVideos.map((url, i) => (
            <div key={`vid-${i}`} className="relative group/vid shrink-0">
              <video
                src={url}
                controls
                preload="metadata"
                className="w-full max-w-xs rounded-lg bg-neutral-900 aspect-video object-contain"
              />
              {isAdmin && (
                <button
                  onClick={() => handleRemoveMedia(url)}
                  disabled={removingMedia === url}
                  title="Eliminar video"
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-danger-600 transition-colors cursor-pointer z-10 opacity-0 group-hover/vid:opacity-100"
                >
                  {removingMedia === url
                    ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    : <X className="h-2.5 w-2.5" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-hidden"
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
      <div className="flex items-center gap-4">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!currentUserId || likingPost}
          title={currentUserId ? (isLiked ? 'Quitar me gusta' : 'Me gusta') : 'Inicia sesión para dar me gusta'}
          className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer disabled:opacity-40 ${
            isLiked
              ? 'text-rose-500 dark:text-rose-400'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400'
          }`}
        >
          <Heart className={`h-4 w-4 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Comments */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
        >
          <MessageCircle className="h-4 w-4" />
          {localComments?.length || 0} {localComments?.length === 1 ? 'comentario' : 'comentarios'}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          {[...localComments]
            .sort((a, b) => {
              // Pin resolving comment first
              if (a.id === resolucionCommentId) return -1
              if (b.id === resolucionCommentId) return 1
              return 0
            })
            .map((comment) => {
            const isResolucion = comment.id === resolucionCommentId
            const canMarkResolucion = resuelto && (currentUserId === post.user_id || isAdmin)
            return (
            <div
              key={comment.id}
              className={`mb-3 flex gap-2.5 rounded-lg p-3 ${
                isResolucion
                  ? 'bg-success-50 dark:bg-success-900/20 border border-success-300 dark:border-success-700'
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
                  <ComunidadBadge profile={comment.profiles} />
                  {isResolucion && (
                    <span className="inline-flex items-center gap-0.5 text-success-600 dark:text-success-400 font-semibold">
                      <BadgeCheck className="h-3 w-3 fill-current" />
                      Resolvió el problema
                    </span>
                  )}
                  <span>·</span>
                  <span>{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                  {comment.contenido}
                </p>
                {/* Inline actions: like + reply */}
                <div className="mt-1.5 flex items-center gap-3">
                  {currentUserId && !comment.id.startsWith('opt-') && (() => {
                    const cLike = commentLikes[comment.id] ?? { count: 0, liked: false }
                    return (
                      <button
                        type="button"
                        onClick={() => handleCommentLike(comment.id)}
                        disabled={likingCommentId === comment.id}
                        className={`inline-flex items-center gap-1 text-[11px] transition-colors cursor-pointer disabled:opacity-40 ${
                          cLike.liked
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-neutral-400 dark:text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${cLike.liked ? 'fill-current' : ''}`} />
                        {cLike.count > 0 && <span>{cLike.count}</span>}
                      </button>
                    )
                  })()}
                  {currentUserId && !comment.id.startsWith('opt-') && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = comment.profiles?.nombre_completo || 'Usuario'
                        setCommentText(`@${name} `)
                        setShowComments(true)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                    >
                      <Reply className="h-3 w-3" />
                      Responder
                    </button>
                  )}
                </div>
                {/* Comment images: lazy-loaded media_urls + imagen_url fallback (legacy) */}
                {(() => {
                  const imgs: string[] = (commentMediaMap[comment.id]?.length)
                    ? commentMediaMap[comment.id]
                    : comment.imagen_url
                    ? [comment.imagen_url]
                    : []
                  if (!imgs.length) return null
                  return (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {imgs.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxUrl(url)}
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-lg cursor-zoom-in group"
                        >
                          <img
                            src={url}
                            alt={`Imagen ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
              {/* Actions: resolución (owner/admin) + delete (admin) — hidden on optimistic */}
              <div className="flex flex-col gap-1 shrink-0">
                {/* Mark as resolución — visible to post owner or admin when post is resuelto */}
                {canMarkResolucion && !comment.id.startsWith('opt-') && (
                  <button
                    onClick={() => handleSetResolucion(comment.id)}
                    disabled={settingResolucion === comment.id}
                    title={isResolucion ? 'Quitar como resolución' : 'Marcar como respuesta que resolvió'}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                      isResolucion
                        ? 'text-success-500 bg-success-50 dark:bg-success-900/30'
                        : 'text-neutral-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-900/30'
                    }`}
                  >
                    {settingResolucion === comment.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <BadgeCheck className={`h-3.5 w-3.5 ${isResolucion ? 'fill-current' : ''}`} />
                    }
                  </button>
                )}
                {isAdmin && !comment.id.startsWith('opt-') && (
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
                )}
              </div>
            </div>
            )
          })}

          <form onSubmit={handleComment} className="mt-3 flex flex-col gap-2">
            {/* Image previews (up to 5) */}
            {commentImages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {commentImages.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                    <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                    {img.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      </div>
                    )}
                    {!img.uploading && (
                      <button
                        type="button"
                        onClick={() => setCommentImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {/* Image picker button */}
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                disabled={commentImages.length >= 5}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Adjuntar imagen (máx. 5)"
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
