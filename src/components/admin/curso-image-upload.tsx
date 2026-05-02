'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateCursoImage } from '@/actions/admin'

const BUCKET = 'cursos-portadas'
const UPLOAD_URL = '/api/admin/upload-portada'

interface Props {
  cursoId: string
  currentImageUrl: string | null
  onUpdate?: (newUrl: string | null) => void
}

export function CursoImageUpload({ cursoId, currentImageUrl, onUpdate }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient() // used only for DELETE (remove)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Solo se aceptan imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Máximo 5 MB')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const storagePath = `${cursoId}/portada.${ext}`

      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', BUCKET)
      fd.append('path', storagePath)

      const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Error al subir')

      const url = `${json.url}?t=${Date.now()}`
      const result = await updateCursoImage(cursoId, json.url)
      if ('error' in result && result.error) throw new Error(result.error)

      setImageUrl(url)
      onUpdate?.(json.url)
      showToast('Imagen guardada')
    } catch (err: any) {
      showToast(err?.message || 'Error al subir')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (!imageUrl) return
    if (!confirm('¿Eliminar la imagen de este curso?')) return
    setRemoving(true)
    try {
      const path = `${cursoId}/portada`
      await supabase.storage.from(BUCKET).remove([
        `${path}.jpg`, `${path}.jpeg`, `${path}.png`,
        `${path}.webp`, `${path}.gif`,
      ])
      const result = await updateCursoImage(cursoId, null)
      if ('error' in result && result.error) throw new Error(result.error)
      setImageUrl(null)
      onUpdate?.(null)
      showToast('Imagen eliminada')
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {imageUrl ? (
        <div className="flex items-center gap-1.5">
          <div className="relative h-8 w-12 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <Image
              src={imageUrl}
              alt="portada"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Cambiar imagen"
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-500 dark:hover:bg-primary-900/20 transition-colors cursor-pointer disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            title="Eliminar imagen"
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-40"
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Agregar imagen al curso"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-primary-50 hover:text-primary-500 dark:hover:bg-primary-900/20 transition-colors cursor-pointer disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          <span>{uploading ? 'Subiendo...' : 'Imagen'}</span>
        </button>
      )}

      {toast && (
        <span className="absolute -top-8 left-0 flex items-center gap-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 px-2.5 py-1 text-xs font-medium text-white dark:text-neutral-900 shadow whitespace-nowrap z-50">
          <CheckCircle className="h-3 w-3" />
          {toast}
        </span>
      )}
    </div>
  )
}
