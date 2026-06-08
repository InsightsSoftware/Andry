'use client'

import { useState } from 'react'
import { BookOpen, CheckCircle2, XCircle, Flag, Loader2, AlertTriangle } from 'lucide-react'
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
  opciones: { key: 'a' | 'b' | 'c' | 'd'; text: string; imagenUrl?: string | null }[]
  selectedAnswer: 'a' | 'b' | 'c' | 'd' | null
  flagged: boolean
  onSelect: (respuesta: 'a' | 'b' | 'c' | 'd') => void
  onToggleFlag: () => void
  onNext: () => void
  onPrev: () => void
  onFinish: () => void
  onRevisar?: () => void
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
  onRevisar,
  isPractica = false,
  feedback = null,
  submitting = false,
}: ExamQuestionCardProps) {
  const locked = isPractica && (!!feedback || submitting)
  const [showFinishModal, setShowFinishModal] = useState(false)

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
            <span className="flex-1 min-w-0">
              {op.imagenUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={op.imagenUrl}
                  alt={`Opción ${op.key.toUpperCase()}`}
                  className="mb-2 rounded-lg max-h-40 w-auto object-contain"
                />
              )}
              {op.text && (
                <span className="text-base font-medium text-neutral-800 dark:text-neutral-200 block pt-0.5">
                  {op.text}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Practice feedback */}
      {isPractica && feedback && (
        <div className="mb-5 rounded-xl border border-success-400 dark:border-success-600 bg-success-50 dark:bg-success-900/15 p-4 text-sm leading-relaxed">
          <p className="font-semibold mb-1 text-success-700 dark:text-success-400">
            Explicación
          </p>
          {feedback.explicacion && (
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{feedback.explicacion}</p>
          )}
          {(feedback.paginaLibro ?? 0) > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
              <BookOpen className="h-3 w-3" />
              Página {feedback.paginaLibro}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3">

        {isPractica ? (
          /* Practice: Finalizar | Anterior + [Revisar] + Siguiente */
          <>
            {/* Left: Finalizar */}
            <button
              onClick={() => setShowFinishModal(true)}
              className="rounded-xl border border-success-300 dark:border-success-700 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors cursor-pointer"
            >
              Finalizar
            </button>

            {/* Right: Anterior + Revisar + Siguiente */}
            <div className="flex gap-2">
              <button
                onClick={onPrev}
                disabled={numero <= 1}
                className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Anterior
              </button>

              {/* Revisar: only when selection exists and not yet reviewed */}
              {selectedAnswer && !feedback && (
                <button
                  onClick={onRevisar}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 dark:bg-violet-500 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : 'Revisar respuesta'
                  }
                </button>
              )}

              {/* Siguiente / Finalizar */}
              {numero < total ? (
                <button
                  onClick={onNext}
                  className="rounded-xl bg-primary-600 dark:bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={() => setShowFinishModal(true)}
                  className="rounded-xl bg-success-500 px-6 py-3 text-sm font-semibold text-white hover:bg-success-600 transition-colors cursor-pointer"
                >
                  Finalizar práctica
                </button>
              )}
            </div>
          </>
        ) : (
          /* Exam mode: Finalizar on the left, Anterior + Siguiente on the right */
          <>
            {/* Left: Finalizar (always visible in exam mode) */}
            <button
              onClick={() => setShowFinishModal(true)}
              className="rounded-xl border border-success-300 dark:border-success-700 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors cursor-pointer"
            >
              Finalizar
            </button>

            {/* Right: Anterior + Siguiente */}
            <div className="flex gap-2">
              <button
                onClick={onPrev}
                disabled={numero <= 1}
                className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              {numero < total ? (
                <button
                  onClick={onNext}
                  className="rounded-xl bg-primary-600 dark:bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={() => setShowFinishModal(true)}
                  className="rounded-xl bg-success-500 px-6 py-3 text-sm font-semibold text-white hover:bg-success-600 transition-colors cursor-pointer"
                >
                  Finalizar Examen
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm Finish Modal */}
      {showFinishModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowFinishModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
                <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {isPractica ? '¿Finalizar la práctica?' : '¿Finalizar el examen?'}
              </h3>
            </div>
            <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isPractica
                ? 'Las preguntas que revisaste quedan guardadas. Las que seleccionaste sin revisar se contarán igual. ¿Querés ver tus resultados ahora?'
                : 'Una vez que finalices no podrás volver a responder preguntas. Se calcularán tus resultados con las respuestas que diste hasta ahora.'
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {isPractica ? 'Seguir practicando' : 'Seguir respondiendo'}
              </button>
              <button
                onClick={() => { setShowFinishModal(false); onFinish() }}
                className="flex-1 rounded-xl bg-success-500 px-4 py-3 text-sm font-semibold text-white hover:bg-success-600 transition-colors cursor-pointer"
              >
                Sí, finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
