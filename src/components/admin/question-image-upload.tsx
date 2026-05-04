'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Trash2, Loader2, Check } from 'lucide-react'
import { createQuestionImageUploadUrl, updateQuestionImage } from '@/actions/admin'
import { createClient } from '@/lib/supabase/client'

interface Props {
  preguntaId: string
  initialImageUrl: string | null
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB = 5

export function QuestionImageUpload({ preguntaId, initialImageUrl }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setDone(false)

    if (!ALLOWED.includes(file.type)) {
      setError('Solo JPEG, PNG, WebP o GIF')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Máximo ${MAX_MB} MB`)
      return
    }

    setUploading(true)
    try {
      // 1. Get signed upload URL from server action
      const res = await createQuestionImageUploadUrl(preguntaId, file.name)
      if ('error' in res) throw new Error(res.error)

      // 2. Upload directly to Supabase Storage
      const uploadRes = await fetch(res.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error(`Upload falló: ${uploadRes.status}`)

      // 3. Build public URL from storage path
      const supabase = createClient()
      const { data: publicData } = supabase.storage
        .from('contenido-cursos')
        .getPublicUrl(res.path)

      const publicUrl = publicData.publicUrl

      // 4. Persist in DB
      const saveRes = await updateQuestionImage(preguntaId, publicUrl)
      if ('error' in saveRes) throw new Error(saveRes.error)

      setImageUrl(publicUrl)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('¿Eliminar imagen de esta pregunta?')) return
    setRemoving(true)
    setError(null)
    try {
      const res = await updateQuestionImage(preguntaId, null)
      if ('error' in res) throw new Error(res.error)
      setImageUrl(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Current image */}
      {imageUrl && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Imagen de la pregunta"
            className="rounded-lg max-h-48 w-auto object-contain border border-neutral-200 dark:border-neutral-700"
          />
          <button
            onClick={handleRemove}
            disabled={removing}
            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Eliminar imagen"
          >
            {removing
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Trash2 className="h-3 w-3" />
            }
          </button>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo...</>
            : done
              ? <><Check className="h-3.5 w-3.5 text-success-500" /> Guardado</>
              : <><ImagePlus className="h-3.5 w-3.5" /> {imageUrl ? 'Cambiar imagen' : 'Agregar imagen'}</>
          }
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
