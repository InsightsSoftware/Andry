'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startExam } from '@/actions/examenes'
import { Loader2, Play } from 'lucide-react'

interface StartExamButtonProps {
  cursoId: string
}

export function StartExamButton({ cursoId }: StartExamButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    const result = await startExam(cursoId)
    if (result.success && result.sesionId) {
      router.push(`/estudio/examen/${result.sesionId}`)
    } else {
      setError(result.error || 'Error al iniciar examen')
      setLoading(false)
    }
  }

  return (
    <div>
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
        {loading ? 'Preparando...' : 'Iniciar Simulacro'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-danger-500">{error}</p>
      )}
    </div>
  )
}
