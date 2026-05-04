'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react'

interface QuestionCardProps {
  preguntaId: string
  numero: number
  total: number
  texto: string
  imagenUrl?: string | null
  opciones: { key: 'a' | 'b' | 'c' | 'd'; text: string }[]
  /** If provided, shows instant feedback (practice mode) */
  onSubmit: (
    respuesta: 'a' | 'b' | 'c' | 'd'
  ) => Promise<{
    esCorrecta: boolean
    respuestaCorrecta: string
    explicacion: string
    paginaLibro: number
  } | null>
  onNext: () => void
  showFeedback?: boolean
}

export function QuestionCard({
  preguntaId,
  numero,
  total,
  texto,
  imagenUrl = null,
  opciones,
  onSubmit,
  onNext,
  showFeedback = true,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<'a' | 'b' | 'c' | 'd' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{
    esCorrecta: boolean
    respuestaCorrecta: string
    explicacion: string
    paginaLibro: number
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelect = (key: 'a' | 'b' | 'c' | 'd') => {
    if (submitted) return
    setSelected(key)
  }

  const handleSubmit = async () => {
    if (!selected || submitted) return
    setLoading(true)
    const res = await onSubmit(selected)
    if (res) {
      setResult(res)
      setSubmitted(true)
    }
    setLoading(false)
  }

  const handleNext = () => {
    setSelected(null)
    setSubmitted(false)
    setResult(null)
    onNext()
  }

  const getOptionStyle = (key: string) => {
    if (!submitted) {
      return selected === key
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
    }
    // After submission
    if (key === result?.respuestaCorrecta) {
      return 'border-success-500 bg-success-50 dark:bg-success-900/20 dark:border-success-400'
    }
    if (key === selected && !result?.esCorrecta) {
      return 'border-danger-500 bg-danger-50 dark:bg-danger-900/20 dark:border-danger-400'
    }
    return 'border-neutral-200 dark:border-neutral-700 opacity-50'
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
          Pregunta {numero} de {total}
        </span>
        <div className="h-1.5 flex-1 mx-4 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
            style={{ width: `${(numero / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question text */}
      <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
        {texto}
      </h3>

      {/* Question image */}
      {imagenUrl && (
        <div className="mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagenUrl}
            alt="Imagen de la pregunta"
            className="rounded-xl max-h-64 w-auto object-contain border border-neutral-200 dark:border-neutral-700"
          />
        </div>
      )}

      {/* Options */}
      <div className="flex flex-col gap-3 mb-5">
        {opciones.map((op) => (
          <button
            key={op.key}
            onClick={() => handleSelect(op.key)}
            disabled={submitted}
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
              getOptionStyle(op.key),
              submitted && 'cursor-default'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                submitted && op.key === result?.respuestaCorrecta
                  ? 'bg-success-500 text-white'
                  : submitted && op.key === selected && !result?.esCorrecta
                    ? 'bg-danger-500 text-white'
                    : selected === op.key && !submitted
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              )}
            >
              {submitted && op.key === result?.respuestaCorrecta ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : submitted && op.key === selected && !result?.esCorrecta ? (
                <XCircle className="h-4 w-4" />
              ) : (
                op.key.toUpperCase()
              )}
            </span>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 pt-0.5">
              {op.text}
            </span>
          </button>
        ))}
      </div>

      {/* Feedback (practice mode) */}
      {submitted && showFeedback && result && (
        <div
          className={cn(
            'mb-5 rounded-xl p-4',
            result.esCorrecta
              ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
              : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.esCorrecta ? (
              <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-400" />
            ) : (
              <XCircle className="h-5 w-5 text-danger-500" />
            )}
            <span
              className={cn(
                'font-semibold',
                result.esCorrecta
                  ? 'text-success-700 dark:text-success-400'
                  : 'text-danger-600 dark:text-danger-400'
              )}
            >
              {result.esCorrecta ? '¡Correcto!' : 'Incorrecto'}
            </span>
          </div>
          {result.explicacion && (
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {result.explicacion}
            </p>
          )}
          {result.paginaLibro > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <BookOpen className="h-3.5 w-3.5" />
              Referencia: página {result.paginaLibro} del libro
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="rounded-xl bg-primary-600 dark:bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Verificando...' : 'Confirmar Respuesta'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-xl bg-primary-600 dark:bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
          >
            {numero < total ? 'Siguiente Pregunta' : 'Ver Resultados'}
          </button>
        )}
      </div>
    </div>
  )
}
