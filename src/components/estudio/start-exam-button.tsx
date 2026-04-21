'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startExam } from '@/actions/examenes'
import { Loader2, Play, Clock, ListChecks, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StartExamButtonProps {
  cursoId: string
  /** Max questions actually available for this course */
  maxPreguntas: number
}

const HORA_OPTIONS = [2, 3, 4, 5, 6]
const CANTIDAD_OPTIONS = [15, 30, 60, 90, 120]

export function StartExamButton({ cursoId, maxPreguntas }: StartExamButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [horas, setHoras] = useState<number>(4)
  // Default question count — pick the largest option that fits the pool
  const defaultCantidad =
    [...CANTIDAD_OPTIONS].reverse().find((n) => n <= maxPreguntas) ?? maxPreguntas
  const [cantidad, setCantidad] = useState<number>(defaultCantidad)

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    const result = await startExam(cursoId, horas, cantidad)
    if (result.success && result.sesionId) {
      router.push(`/estudio/examen/${result.sesionId}`)
    } else {
      setError(result.error || 'Error al iniciar examen')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 dark:bg-primary-500 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
      >
        <Settings2 className="h-4 w-4" />
        Configurar Examen
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-4">
      {/* Horas */}
      <div className="mb-4">
        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          <Clock className="h-3.5 w-3.5" />
          Duración del examen
        </label>
        <div className="flex flex-wrap gap-2">
          {HORA_OPTIONS.map((h) => (
            <button
              key={h}
              onClick={() => setHoras(h)}
              disabled={loading}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50',
                horas === h
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-primary-500'
              )}
            >
              {h} {h === 1 ? 'hora' : 'horas'}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          El examen real de licencia dura ~6 horas y media
        </p>
      </div>

      {/* Cantidad de preguntas */}
      <div className="mb-4">
        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          <ListChecks className="h-3.5 w-3.5" />
          Cantidad de preguntas
        </label>
        <div className="flex flex-wrap gap-2">
          {CANTIDAD_OPTIONS.map((n) => {
            const disabled = n > maxPreguntas
            return (
              <button
                key={n}
                onClick={() => setCantidad(n)}
                disabled={loading || disabled}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                  cantidad === n
                    ? 'bg-primary-600 text-white dark:bg-primary-500'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-primary-500'
                )}
                title={disabled ? `Máximo disponible: ${maxPreguntas}` : undefined}
              >
                {n}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          {maxPreguntas} preguntas disponibles en este curso
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleStart}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 dark:bg-primary-500 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {loading ? 'Preparando...' : `Iniciar examen (${horas}h · ${cantidad} preguntas)`}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-danger-500">{error}</p>
      )}
    </div>
  )
}
