'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileCheck, BookOpenCheck, Flag } from 'lucide-react'
import { ExamQuestionCard, type QuestionFeedback } from './exam-question-card'
import { ExamTimer } from './exam-timer'
import { submitAnswer, finishSession } from '@/actions/examenes'
import { cn } from '@/lib/utils'

interface ExamRunnerProps {
  sesionId: string
  cursoSlug: string
  tiempoLimiteSegundos: number
  isPractica?: boolean
  preguntas: {
    id: string
    texto: string
    opciones: { key: 'a' | 'b' | 'c' | 'd'; text: string }[]
    answered: 'a' | 'b' | 'c' | 'd' | null
  }[]
}

export function ExamRunner({
  sesionId,
  tiempoLimiteSegundos,
  isPractica = false,
  preguntas,
}: ExamRunnerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, 'a' | 'b' | 'c' | 'd'>>(
    () => {
      const initial = new Map<string, 'a' | 'b' | 'c' | 'd'>()
      preguntas.forEach((p) => {
        if (p.answered) initial.set(p.id, p.answered)
      })
      return initial
    }
  )
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [finishing, setFinishing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Practice mode: feedback per question
  const [feedbackMap, setFeedbackMap] = useState<Map<string, QuestionFeedback>>(new Map())
  const startTimeRef = useRef(Date.now())

  // ── Practice: select → submit immediately → show feedback ──────────────
  const handlePracticaSelect = useCallback(async (respuesta: 'a' | 'b' | 'c' | 'd') => {
    const pregunta = preguntas[currentIndex]
    if (feedbackMap.has(pregunta.id)) return // already answered
    if (submitting) return

    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(pregunta.id, respuesta)
      return next
    })
    setSubmitting(true)

    const result = await submitAnswer(sesionId, pregunta.id, respuesta)

    if (result.success) {
      setFeedbackMap((prev) => {
        const next = new Map(prev)
        next.set(pregunta.id, {
          esCorrecta: result.esCorrecta ?? false,
          respuestaCorrecta: result.respuestaCorrecta as 'a' | 'b' | 'c' | 'd',
          explicacion: result.explicacion ?? null,
          paginaLibro: result.paginaLibro ?? null,
        })
        return next
      })
    }
    setSubmitting(false)
  }, [preguntas, currentIndex, feedbackMap, submitting, sesionId])

  // ── Exam: just record selection locally ────────────────────────────────
  const handleExamSelect = (respuesta: 'a' | 'b' | 'c' | 'd') => {
    const pregunta = preguntas[currentIndex]
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(pregunta.id, respuesta)
      return next
    })
  }

  const handleSelect = isPractica ? handlePracticaSelect : handleExamSelect

  const handleToggleFlag = useCallback(() => {
    const pregunta = preguntas[currentIndex]
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(pregunta.id)) next.delete(pregunta.id)
      else next.add(pregunta.id)
      return next
    })
  }, [preguntas, currentIndex])

  const handleFinish = useCallback(async () => {
    if (finishing) return
    setFinishing(true)

    if (!isPractica) {
      // Exam mode: submit all answers at once
      await Promise.all(
        preguntas.map(async (p) => {
          const answer = answers.get(p.id)
          if (answer) await submitAnswer(sesionId, p.id, answer)
        })
      )
    }
    // Practice: answers already submitted one by one

    const tiempoUsado = Math.floor((Date.now() - startTimeRef.current) / 1000)
    await finishSession(sesionId, tiempoUsado)
    router.push(`/estudio/resultados/${sesionId}`)
  }, [finishing, isPractica, preguntas, answers, sesionId, router])

  const handleTimeUp = useCallback(() => { handleFinish() }, [handleFinish])

  const pregunta = preguntas[currentIndex]
  const answeredCount = answers.size
  const flaggedCount = flagged.size
  const totalCount = preguntas.length
  const currentFeedback = feedbackMap.get(pregunta.id) ?? null

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {isPractica
            ? <BookOpenCheck className="h-5 w-5 text-violet-500" />
            : <FileCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          }
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {isPractica ? 'Práctica Libre' : 'Examen Simulación Real'}
          </span>
        </div>
        {/* Timer — only for exam */}
        {!isPractica && (
          <ExamTimer
            tiempoLimiteSegundos={tiempoLimiteSegundos}
            onTimeUp={handleTimeUp}
          />
        )}
      </div>

      {/* Progress pills — exam only (practice is linear) */}
      {!isPractica && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {preguntas.map((p, i) => {
            const isAnswered = answers.has(p.id)
            const isFlagged = flagged.has(p.id)
            const isCurrent = i === currentIndex
            return (
              <button
                key={p.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  isCurrent
                    ? 'bg-primary-600 text-white dark:bg-primary-500 ring-2 ring-primary-300 dark:ring-primary-700 ring-offset-1 ring-offset-white dark:ring-offset-neutral-950'
                    : isFlagged && isAnswered
                      ? 'bg-warning-100 dark:bg-warning-900/40 text-warning-800 dark:text-warning-300 ring-1 ring-warning-400 dark:ring-warning-600'
                      : isFlagged
                        ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 ring-1 ring-warning-300 dark:ring-warning-700'
                        : isAnswered
                          ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                )}
                aria-label={`Pregunta ${i + 1}${isAnswered ? ' respondida' : ''}${isFlagged ? ' marcada' : ''}`}
              >
                {i + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center">
                    <Flag className="h-2.5 w-2.5 fill-warning-500 text-warning-500" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Status bar */}
      <div className="mb-4 flex items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
        <span>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{answeredCount}</span>{' '}
          de {totalCount} {isPractica ? 'completadas' : 'respondidas'}
        </span>
        {!isPractica && flaggedCount > 0 && (
          <span className="flex items-center gap-1 text-warning-600 dark:text-warning-400">
            <Flag className="h-3 w-3 fill-current" />
            <span className="font-semibold">{flaggedCount}</span> marcada{flaggedCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Question */}
      {finishing ? (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-12 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {isPractica ? 'Guardando práctica...' : 'Finalizando examen...'}
          </p>
        </div>
      ) : (
        <ExamQuestionCard
          numero={currentIndex + 1}
          total={totalCount}
          texto={pregunta.texto}
          opciones={pregunta.opciones}
          selectedAnswer={answers.get(pregunta.id) || null}
          flagged={flagged.has(pregunta.id)}
          onSelect={handleSelect}
          onToggleFlag={handleToggleFlag}
          onNext={() => setCurrentIndex((prev) => Math.min(prev + 1, totalCount - 1))}
          onPrev={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          onFinish={handleFinish}
          isPractica={isPractica}
          feedback={currentFeedback}
          submitting={submitting}
        />
      )}
    </div>
  )
}
