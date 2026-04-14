'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { createPost } from '@/actions/comunidad'

interface PostFormProps {
  tipo: 'duda' | 'trabajo'
  onClose: () => void
  onSuccess: () => void
}

export function PostForm({ tipo, onClose, onSuccess }: PostFormProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const isDuda = tipo === 'duda'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(formRef.current!)
    formData.set('tipo', tipo)

    const result = await createPost(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">
          {isDuda ? 'Publicar una duda' : 'Publicar un trabajo'}
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
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
              ? 'Ej: Duda sobre calculo de carga electrica'
              : 'Ej: Busco electricista para proyecto residencial'
          }
          required
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {isDuda ? 'Describe tu duda' : 'Descripcion del trabajo'}
          </label>
          <textarea
            name="contenido"
            rows={4}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder={
              isDuda
                ? 'Explica tu duda con el mayor detalle posible...'
                : 'Describe el trabajo, requisitos, fecha estimada...'
            }
            required
          />
        </div>

        {!isDuda && (
          <>
            <Input
              label="Ubicacion"
              name="ubicacion"
              placeholder="Ej: Miami, FL"
            />
            <Input
              label="Presupuesto estimado"
              name="presupuesto"
              placeholder="Ej: $500 - $1,000"
            />
          </>
        )}

        {error && (
          <p className="rounded-lg bg-danger-500/10 px-4 py-2 text-sm text-danger-500">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} size="lg">
          {isDuda ? 'Publicar Duda' : 'Publicar Trabajo'}
        </Button>
      </form>
    </div>
  )
}
