'use client'

import { BookOpen, CheckCircle2, XCircle, Flag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QuestionFeedback {
  esCorrecta: boolean
  respuestaCorrecta: 'a' | 'b' | 'c' | 'd'
  explicacion: string | null
  paginaLibro: number | null
}

interface ExamQuestionCardProps {
  numero: number
  total: number
  texto: string
  imagenUrl?: string | null
  opciones: { key: 'a' | 'b' | 'c' | 'd'; text: string }[]
  selectedAnswer: 'a' | 'b' | 'c' | 'd' | null
  flagged: boolean
  onSelect: (respuesta: 'a' | 'b' | 'c' | 'd') => void
  onToggleFlag: () => void
  onNext: () => void
  onPrev: () => void
  onFinish: () => void
  // Practice mode
  isPractica?: boolean
  feedback?: QuestionFeedback | null
  submitting?: boolean
}

export function ExamQuestionCard({
  numero,
  total,
  texto,
  imagenUrl = null,
  opciones,
  selectedAnswer,
  flagged,
  onSelect,
  onToggleFlag,
  onNext,
  onPrev,
  onFinish,
  isPractica = false,
  feedback = null,
  submitting = false,
}: ExamQuestionCardProps) {
  const locked = isPractica && (!!feedback || submitting)

  function getOptionStyle(key: 'a' | 'b' | 'c' | 'd') {
    if (!isPractica || !feedback) {
      // Exam mode (or practice before answer)
      return selectedAnswer === key
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
    }
    // Practice mode with feedback
    const isCorrect = key === feedback.respuestaCorrecta
    const isWrong = key === selectedAnswer && !feedback.esCorrecta
    if (isCorrect) return 'border-success-400 bg-success-50 dark:bg-success-900/20 dark:border-success-500'
    if (isWrong)   return 'border-danger-400 bg-danger-50 dark:bg-danger-900/20 dark:border-danger-500'
    return 'border-neutral-200 dark:border-neutral-700 opacity-50'
  }

  function getBadgeStyle(key: 'a' | 'b' | 'c' | 'd') {
    if (!isPractica || !feedback) {
      return selectedAnswer === key
        ? 'bg-primary-600 text-white dark:bg-primary-500'
        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
    }
    const isCorrect = key === feedback.respuestaCorrecta
    const isWrong = key === selectedAnswer && !feedback.esCorrecta
    if (isCorrect) return 'bg-success-500 text-white'
    if (isWrong)   return 'bg-danger-500 text-white'
    return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
          Pregunta {numero} de {total}
        </span>
        <div className="h-1.5 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
            style={{ width: `${(numero / total) * 100}%` }}
          />
        </div>
        {/* Flag — only in exam mode */}
        {!isPractica && (
          <button
            onClick={onToggleFlag}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0',
              flagged
                ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border border-warning-300 dark:border-warning-700'
                : 'text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            )}
            aria-label={flagged ? 'Quitar marca' : 'Marcar con duda'}
          >
            <Flag className={cn('h-3.5 w-3.5', flagged && 'fill-current')} />
            <span className="hidden sm:inline">{flagged ? 'Marcada' : 'Marcar'}</span>
          </button>
        )}
      </div>

      {/* Question */}
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
            onClick={() => !locked && onSelect(op.key)}
            disabled={locked}
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
              locked ? 'cursor-default' : 'cursor-pointer',
              getOptionStyle(op.key)
            )}
          >
            <span className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
              getBadgeStyle(op.key)
            )}>
              {submitting && selectedAnswer === op.key
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : isPractica && feedback && op.key === feedback.respuestaCorrecta
                  ? <CheckCircle2 className="h-4 w-4" />
                  : isPractica && feedback && op.key === selectedAnswer && !feedback.esCorrecta
                    ? <XCircle className="h-4 w-4" />
                    : op.key.toUpperCase()
              }
            </span>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 pt-0.5">
              {op.text}
            </span>
          </button>
        ))}
      </div>

      {/* Practice feedback */}
      {isPractica && feedback && (
        <div className={cn(
          'mb-5 rounded-xl border p-4 text-sm leading-relaxed',
          feedback.esCorrecta
            ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 text-success-800 dark:text-success-300'
            : 'border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 text-danger-800 dark:text-danger-300'
        )}>
          <p className="font-semibold mb-1">
            {feedback.esCorrecta ? '✓ ¡Correcto!' : '✗ Incorrecto'}
          </p>
          {feedback.explicacion && (
            <p className="text-xs leading-relaxed opacity-90">{feedback.explicacion}</p>
          )}
          {feedback.paginaLibro && feedback.paginaLibro > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] opacity-70">
              <BookOpen className="h-3 w-3" />
              Página {feedback.paginaLibro}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        {/* Prev — exam only */}
        {!isPractica && (
          <button
            onClick={onPrev}
            disabled={numero <= 1}
            className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Anterior
          </button>
        )}

        {isPractica ? (
          /* Practice: show Siguiente/Finalizar only after feedback */
          <div className="ml-auto">
            {feedback && (
              numero < total ? (
                <button
                  onClick={onNext}
                  className="rounded-xl bg-primary-600 dark:bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={onFinish}
                  className="rounded-xl bg-success-500 px-6 py-3 text-sm font-semibold text-white hover:bg-success-600 transition-colors cursor-pointer"
                >
                  Ver resultados
                </button>
              )
            )}
            {!feedback && !submitting && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic pt-3">
                Seleccioná una opción para ver el resultado
              </p>
            )}
          </div>
        ) : (
          /* Exam: original navigation */
          <div className="flex gap-2">
            {numero < total && (
              <button
                onClick={onFinish}
                className="rounded-xl border border-success-300 dark:border-success-700 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors cursor-pointer"
              >
                Finalizar
              </button>
            )}
            {numero < total ? (
              <button
                onClick={onNext}
                className="rounded-xl bg-primary-600 dark:bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={onFinish}
                className="rounded-xl bg-success-500 px-6 py-3 text-sm font-semibold text-white hover:bg-success-600 transition-colors cursor-pointer"
              >
                Finalizar Examen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
