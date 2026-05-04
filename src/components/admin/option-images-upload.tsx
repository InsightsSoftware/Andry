'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Trash2, Loader2, Check } from 'lucide-react'
import { createOptionImageUploadUrl, updateOptionImage } from '@/actions/admin'
import { createClient } from '@/lib/supabase/client'

interface Props {
  preguntaId: string
  initialImages: {
    a: string | null
    b: string | null
    c: string | null
    d: string | null
  }
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB = 5
const OPCIONES = ['a', 'b', 'c', 'd'] as const

export function OptionImagesUpload({ preguntaId, initialImages }: Props) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState<'a' | 'b' | 'c' | 'd' | null>(null)
  const [removing, setRemoving]   = useState<'a' | 'b' | 'c' | 'd' | null>(null)
  const [done, setDone]           = useState<'a' | 'b' | 'c' | 'd' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const inputRefs = {
    a: useRef<HTMLInputElement>(null),
    b: useRef<HTMLInputElement>(null),
    c: useRef<HTMLInputElement>(null),
    d: useRef<HTMLInputElement>(null),
  }

  const handleFile = async (opcion: 'a' | 'b' | 'c' | 'd', file: File) => {
    setErrors((prev) => ({ ...prev, [opcion]: '' }))
    if (!ALLOWED.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [opcion]: 'Solo JPEG, PNG, WebP o GIF' }))
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [opcion]: `Máximo ${MAX_MB} MB` }))
      return
    }

    setUploading(opcion)
    try {
      const res = await createOptionImageUploadUrl(preguntaId, opcion, file.name)
      if ('error' in res) throw new Error(res.error)

      const uploadRes = await fetch(res.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error(`Upload falló: ${uploadRes.status}`)

      const supabase = createClient()
      const { data: publicData } = supabase.storage
        .from('contenido-cursos')
        .getPublicUrl(res.path)

      const publicUrl = publicData.publicUrl
      const saveRes = await updateOptionImage(preguntaId, opcion, publicUrl)
      if ('error' in saveRes) throw new Error(saveRes.error)

      setImages((prev) => ({ ...prev, [opcion]: publicUrl }))
      setDone(opcion)
      setTimeout(() => setDone(null), 2500)
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [opcion]: e instanceof Error ? e.message : 'Error desconocido',
      }))
    } finally {
      setUploading(null)
    }
  }

  const handleRemove = async (opcion: 'a' | 'b' | 'c' | 'd') => {
    if (!confirm(`¿Eliminar imagen de la opción ${opcion.toUpperCase()}?`)) return
    setRemoving(opcion)
    setErrors((prev) => ({ ...prev, [opcion]: '' }))
    try {
      const res = await updateOptionImage(preguntaId, opcion, null)
      if ('error' in res) throw new Error(res.error)
      setImages((prev) => ({ ...prev, [opcion]: null }))
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [opcion]: e instanceof Error ? e.message : 'Error al eliminar',
      }))
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        Imágenes de opciones (opcional)
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPCIONES.map((op) => (
          <div key={op} className="space-y-1">
            <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
              Opción {op.toUpperCase()}
            </p>

            {images[op] && (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[op]!}
                  alt={`Imagen opción ${op.toUpperCase()}`}
                  className="rounded-lg max-h-28 w-auto object-contain border border-neutral-200 dark:border-neutral-700"
                />
                <button
                  onClick={() => handleRemove(op)}
                  disabled={removing === op}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                  title="Eliminar"
                >
                  {removing === op
                    ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    : <Trash2 className="h-2.5 w-2.5" />
                  }
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRefs[op].current?.click()}
              disabled={uploading === op}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 px-2.5 py-1 text-[10px] text-neutral-600 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading === op
                ? <><Loader2 className="h-3 w-3 animate-spin" /> Subiendo...</>
                : done === op
                  ? <><Check className="h-3 w-3 text-success-500" /> Guardado</>
                  : <><ImagePlus className="h-3 w-3" /> {images[op] ? 'Cambiar' : 'Agregar'}</>
              }
            </button>
            <input
              ref={inputRefs[op]}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(op, file)
                e.target.value = ''
              }}
            />
            {errors[op] && (
              <p className="text-[10px] text-red-500">{errors[op]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
