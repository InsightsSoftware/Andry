'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, ImagePlus, Video, Loader2 } from 'lucide-react'
import { createPost } from '@/actions/comunidad'

interface PostFormProps {
  tipo: 'duda' | 'trabajo'
  onClose: () => void
  onSuccess: () => void
}

type MediaItem = {
  id: string            // local id for react key
  file: File
  url: string           // object URL for preview (before upload) OR remote URL after upload
  uploaded: boolean
  uploading: boolean
  error: string | null
  isVideo: boolean
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']

const MAX_ITEMS = 5 // max 5 images + 5 videos

export function PostForm({ tipo, onClose, onSuccess }: PostFormProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<MediaItem[]>([])
  const [videos, setVideos] = useState<MediaItem[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const vidInputRef = useRef<HTMLInputElement>(null)

  const isDuda = tipo === 'duda'

  // ── Upload a single file to storage ──────────────────────────────────────
  async function uploadFile(item: MediaItem): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', item.file)

    const res = await fetch('/api/comunidad/upload-media', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok || !data.url) return null
    return data.url as string
  }

  // ── Handle image picker ───────────────────────────────────────────────────
  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''                             // reset input so same file re-picks
    const available = MAX_ITEMS - images.length
    if (available <= 0) return
    const picked = files.slice(0, available)

    const newItems: MediaItem[] = picked.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      url: URL.createObjectURL(f),
      uploaded: false,
      uploading: true,
      error: null,
      isVideo: false,
    }))

    setImages((prev) => [...prev, ...newItems])

    // Upload each file immediately
    for (const item of newItems) {
      const remoteUrl = await uploadFile(item)
      setImages((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? remoteUrl
              ? { ...x, url: remoteUrl, uploaded: true, uploading: false }
              : { ...x, uploading: false, error: 'Error al subir' }
            : x
        )
      )
    }
  }

  // ── Handle video picker ───────────────────────────────────────────────────
  async function handleVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    const available = MAX_ITEMS - videos.length
    if (available <= 0) return
    const picked = files.slice(0, available)

    const newItems: MediaItem[] = picked.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      url: URL.createObjectURL(f),
      uploaded: false,
      uploading: true,
      error: null,
      isVideo: true,
    }))

    setVideos((prev) => [...prev, ...newItems])

    for (const item of newItems) {
      const remoteUrl = await uploadFile(item)
      setVideos((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? remoteUrl
              ? { ...x, url: remoteUrl, uploaded: true, uploading: false }
              : { ...x, uploading: false, error: 'Error al subir' }
            : x
        )
      )
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((x) => x.id !== id))
  }

  function removeVideo(id: string) {
    setVideos((prev) => prev.filter((x) => x.id !== id))
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Make sure all uploads finished
    const stillUploading = [...images, ...videos].some((x) => x.uploading)
    if (stillUploading) {
      setError('Esperá a que terminen de subir todos los archivos.')
      return
    }
    const failedUploads = [...images, ...videos].some((x) => x.error)
    if (failedUploads) {
      setError('Algunos archivos no se pudieron subir. Eliminá los que tienen error y volvé a intentar.')
      return
    }

    setLoading(true)

    const formData = new FormData(formRef.current!)
    formData.set('tipo', tipo)

    const allUrls = [
      ...images.filter((x) => x.uploaded).map((x) => x.url),
      ...videos.filter((x) => x.uploaded).map((x) => x.url),
    ]
    formData.set('media_urls', JSON.stringify(allUrls))

    const result = await createPost(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
  }

  const anyUploading = [...images, ...videos].some((x) => x.uploading)

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          {isDuda ? 'Crear una publicación' : 'Publicar un trabajo'}
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Titulo"
          name="titulo"
          placeholder={
            isDuda
              ? 'Ej: ¿Cómo cotizo un panel eléctrico?'
              : 'Ej: Busco electricista para proyecto residencial'
          }
          required
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {isDuda ? 'Describe tu publicación' : 'Descripcion del trabajo'}
          </label>
          <textarea
            name="contenido"
            rows={4}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-4 py-3 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/30"
            placeholder={
              isDuda
                ? 'Escribí tu publicación con el mayor detalle posible...'
                : 'Describe el trabajo, requisitos, fecha estimada...'
            }
            required
          />
        </div>

        {!isDuda && (
          <>
            <Input
              label="Ubicación (opcional)"
              name="ubicacion"
              placeholder="Ej: Miami, FL · Sur de Florida · cualquier texto"
            />
            <Input
              label="Presupuesto estimado (opcional)"
              name="presupuesto"
              placeholder="Ej: $500 - $1,000 · A convenir"
            />
          </>
        )}

        {/* ── Media section ───────────────────────────────────────────── */}
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Fotos y videos <span className="font-normal text-neutral-400 dark:text-neutral-500">(opcional · máx 5 fotos + 5 videos)</span>
          </p>

          {/* Previews */}
          {(images.length > 0 || videos.length > 0) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {/* Image previews */}
              {images.map((item) => (
                <div key={item.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {item.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  {item.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-danger-500/70 rounded-xl">
                      <span className="text-[9px] font-bold text-white text-center px-1">Error</span>
                    </div>
                  )}
                  {!item.uploading && (
                    <button
                      type="button"
                      onClick={() => removeImage(item.id)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Video previews */}
              {videos.map((item) => (
                <div key={item.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-800 flex items-center justify-center">
                  {item.uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                  ) : item.error ? (
                    <span className="text-[9px] font-bold text-danger-400 text-center px-1">Error</span>
                  ) : (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      muted
                    />
                  )}
                  {!item.uploading && (
                    <button
                      type="button"
                      onClick={() => removeVideo(item.id)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Picker buttons */}
          <div className="flex gap-2">
            {/* Image picker */}
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              disabled={images.length >= MAX_ITEMS}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ImagePlus className="h-4 w-4" />
              Fotos ({images.length}/{MAX_ITEMS})
            </button>
            <input
              ref={imgInputRef}
              type="file"
              accept={IMAGE_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={handleImagePick}
            />

            {/* Video picker */}
            <button
              type="button"
              onClick={() => vidInputRef.current?.click()}
              disabled={videos.length >= MAX_ITEMS}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Video className="h-4 w-4" />
              Videos ({videos.length}/{MAX_ITEMS})
            </button>
            <input
              ref={vidInputRef}
              type="file"
              accept={VIDEO_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={handleVideoPick}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-danger-500/10 dark:bg-danger-500/20 px-4 py-2 text-sm text-danger-500">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading || anyUploading} size="lg">
          {anyUploading ? 'Subiendo archivos...' : isDuda ? 'Publicar' : 'Publicar Trabajo'}
        </Button>
      </form>
    </div>
  )
}
