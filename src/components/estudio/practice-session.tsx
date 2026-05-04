'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Brain } from 'lucide-react'
import { QuestionCard } from './question-card'
import { submitAnswer, startPractice, finishSession } from '@/actions/examenes'

interface PracticeSessionProps {
  capituloId: string
  capituloNombre: string
  cursoId: string
  cursoSlug: string
  cursoNombre: string
  preguntas: {
    id: string
    texto: string
    imagenUrl?: string | null
    opciones: { key: 'a' | 'b' | 'c' | 'd'; text: string }[]
  }[]
}

export function PracticeSession({
  capituloId,
  capituloNombre,
  cursoId,
  cursoSlug,
  cursoNombre,
  preguntas,
}: PracticeSessionProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sesionId, setSesionId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const handleStart = useCallback(async () => {
    const result = await startPractice(capituloId, cursoId)
    if (result.success && result.sesionId) {
      setSesionId(result.sesionId)
      setStarted(true)
    }
  }, [capituloId, cursoId])

  const handleSubmit = useCallback(
    async (respuesta: 'a' | 'b' | 'c' | 'd') => {
      if (!sesionId) return null
      const pregunta = preguntas[currentIndex]
      try {
        const result = await submitAnswer(sesionId, pregunta.id, respuesta)
        if (result.success && result.esCorrecta !== undefined) {
          setScore((prev) => ({
            correct: prev.correct + (result.esCorrecta ? 1 : 0),
            total: prev.total + 1,
          }))
          return {
            esCorrecta: result.esCorrecta,
            respuestaCorrecta: result.respuestaCorrecta!,
            explicacion: result.explicacion || '',
            paginaLibro: result.paginaLibro || 0,
          }
        }
        // Even on error, return a fallback so the UI doesn't freeze
        console.error('submitAnswer error:', result.error)
        return {
          esCorrecta: false,
          respuestaCorrecta: '?',
          explicacion: result.error || 'Error al verificar respuesta',
          paginaLibro: 0,
        }
      } catch (err) {
        console.error('submitAnswer exception:', err)
        return {
          esCorrecta: false,
          respuestaCorrecta: '?',
          explicacion: 'Error de conexión al verificar respuesta',
          paginaLibro: 0,
        }
      }
    },
    [sesionId, currentIndex, preguntas]
  )

  const handleNext = useCallback(async () => {
    if (currentIndex < preguntas.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Finish session and go to results
      if (sesionId) {
        await finishSession(sesionId)
        router.push(`/estudio/resultados/${sesionId}`)
      }
    }
  }, [currentIndex, preguntas.length, sesionId, router])

  if (!started) {
    return (
      <div>
        <Link
          href={`/estudio/${cursoSlug}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {cursoNombre}
        </Link>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
            <Brain className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Práctica: {capituloNombre}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-1">
            {preguntas.length} preguntas con feedback inmediato
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-6">
            Sin límite de tiempo · Verás la explicación después de cada respuesta
          </p>
          <button
            onClick={handleStart}
            className="rounded-xl bg-primary-600 dark:bg-primary-500 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
          >
            Comenzar Práctica
          </button>
        </div>
      </div>
    )
  }

  const pregunta = preguntas[currentIndex]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/estudio/${cursoSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {capituloNombre}
        </Link>
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Brain className="h-4 w-4" />
          Práctica
        </div>
      </div>

      <QuestionCard
        key={pregunta.id}
        preguntaId={pregunta.id}
        numero={currentIndex + 1}
        total={preguntas.length}
        texto={pregunta.texto}
        imagenUrl={pregunta.imagenUrl ?? null}
        opciones={pregunta.opciones}
        onSubmit={handleSubmit}
        onNext={handleNext}
        showFeedback={true}
      />

      {/* Score tracker */}
      {score.total > 0 && (
        <div className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Puntaje actual: {score.correct}/{score.total} correctas
        </div>
      )}
    </div>
  )
}
