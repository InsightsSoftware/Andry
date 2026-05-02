'use client'

import { useState } from 'react'
import {
  MessageCircle,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createComment, markResuelto } from '@/actions/comunidad'
import { AvatarInicial } from './avatar-inicial'

interface Profile {
  nombre_completo: string
  es_mentor?: boolean | null
  oficio?: string | null
  ubicacion?: string | null
}

interface Comment {
  id: string
  contenido: string
  created_at: string
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
  const [showComments, setShowComments] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resuelto, setResuelto] = useState(post.resuelto)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const VIDEO_EXTS = ['.mp4', '.mov', '.webm']
  const media = post.media_urls ?? []
  const mediaImages = media.filter((u) => !VIDEO_EXTS.some((e) => u.toLowerCase().includes(e)))
  const mediaVideos = media.filter((u) => VIDEO_EXTS.some((e) => u.toLowerCase().includes(e)))

  const canResolve = !resuelto && (currentUserId === post.user_id || isAdmin)

  async function handleMarkResuelto() {
    setResolving(true)
    const result = await markResuelto(post.id)
    if (result.error) {
      setError(result.error)
    } else {
      setResuelto(true)
    }
    setResolving(false)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCommenting(true)

    const formData = new FormData()
    formData.set('post_id', post.id)
    formData.set('contenido', commentText)

    const result = await createComment(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setCommentText('')
    }
    setCommenting(false)
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <AvatarInicial
          nombre={post.profiles?.nombre_completo}
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
            <button
              key={i}
              type="button"
              onClick={() => setLightboxUrl(url)}
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              style={{ aspectRatio: mediaImages.length === 1 ? '16/9' : '1/1' }}
            >
              <img
                src={url}
                alt={`Imagen ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {/* Media: videos */}
      {mediaVideos.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {mediaVideos.map((url, i) => (
            <video
              key={i}
              src={url}
              controls
              preload="metadata"
              className="w-full max-h-72 rounded-xl bg-neutral-900 object-contain"
            />
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
        {post.comentarios?.length || 0} comentarios
      </button>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          {post.comentarios?.map((comment) => (
            <div
              key={comment.id}
              className="mb-3 flex gap-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3"
            >
              <AvatarInicial
                nombre={comment.profiles?.nombre_completo}
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
                  <span>·</span>
                  <span>{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                  {comment.contenido}
                </p>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} className="mt-3 flex gap-2">
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
          </form>
          {error && (
            <p className="mt-2 text-xs text-danger-500">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
