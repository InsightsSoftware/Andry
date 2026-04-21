'use client'

import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamQuestionCardProps {
  numero: number
  total: number
  texto: string
  opciones: { key: 'a' | 'b' | 'c' | 'd'; text: string }[]
  selectedAnswer: 'a' | 'b' | 'c' | 'd' | null
  flagged: boolean
  onSelect: (respuesta: 'a' | 'b' | 'c' | 'd') => void
  onToggleFlag: () => void
  onNext: () => void
  onPrev: () => void
  onFinish: () => void
}

export function ExamQuestionCard({
  numero,
  total,
  texto,
  opciones,
  selectedAnswer,
  flagged,
  onSelect,
  onToggleFlag,
  onNext,
  onPrev,
  onFinish,
}: ExamQuestionCardProps) {
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
        {/* Flag button */}
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
          <span className="hidden sm:inline">
            {flagged ? 'Marcada' : 'Marcar'}
          </span>
        </button>
      </div>

      {/* Question */}
      <h3 className="mb-5 text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
        {texto}
      </h3>

      {/* Options */}
      <div className="flex flex-col gap-3 mb-5">
        {opciones.map((op) => (
          <button
            key={op.key}
            onClick={() => onSelect(op.key)}
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer',
              selectedAnswer === op.key
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                selectedAnswer === op.key
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              )}
            >
              {op.key.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 pt-0.5">
              {op.text}
            </span>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={onPrev}
          disabled={numero <= 1}
          className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Anterior
        </button>
        <div className="flex gap-3">
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
      </div>
    </div>
  )
}
