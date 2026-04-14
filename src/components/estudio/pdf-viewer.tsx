'use client'

import { useState, useCallback, useEffect } from 'react'
import { updateProgress } from '@/actions/estudio'
import { CheckCircle2, ExternalLink, FileText } from 'lucide-react'

interface PDFViewerProps {
  contenidoId: string
  archivoUrl: string
  initialProgress: number
}

export function PDFViewer({
  contenidoId,
  archivoUrl,
  initialProgress,
}: PDFViewerProps) {
  const [progress, setProgress] = useState(initialProgress)
  const [completed, setCompleted] = useState(initialProgress >= 95)
  const [saving, setSaving] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  // Show fallback after 3 seconds as a safety net
  useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleMarkComplete = useCallback(async () => {
    setSaving(true)
    const result = await updateProgress(contenidoId, 100)
    if (result.success) {
      setProgress(100)
      setCompleted(true)
    }
    setSaving(false)
  }, [contenidoId])

  const handleMarkProgress = useCallback(
    async (pct: number) => {
      setSaving(true)
      const result = await updateProgress(contenidoId, pct)
      if (result.success) {
        setProgress(pct)
        if (result.completado) setCompleted(true)
      }
      setSaving(false)
    },
    [contenidoId]
  )

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Progress controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {!completed ? (
          <>
            {[25, 50, 75].map((pct) => (
              <button
                key={pct}
                onClick={() => handleMarkProgress(pct)}
                disabled={saving || progress >= pct}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  progress >= pct
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                } disabled:opacity-50`}
              >
                {pct}%
              </button>
            ))}
            <button
              onClick={handleMarkComplete}
              disabled={saving}
              className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Marcar completado'}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-success-600 dark:text-success-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Completado</span>
          </div>
        )}

        <a
          href={archivoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir en nueva pestaña
        </a>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-1.5 rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* PDF embed */}
      <div className="flex-1 min-h-[500px] rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-neutral-50 dark:bg-neutral-800">
        <iframe
          src={archivoUrl}
          className="h-full w-full"
          title="Visor de PDF"
          style={{ minHeight: '500px' }}
        />
      </div>

      {/* Fallback — appears after 3s as a helper for cases where iframe is blocked */}
      {showFallback && (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <FileText className="h-8 w-8 shrink-0 text-neutral-400 dark:text-neutral-500" />
          <div className="flex-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              ¿No se muestra el PDF? Algunos navegadores bloquean la vista previa.
            </p>
          </div>
          <a
            href={archivoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 dark:bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir PDF
          </a>
        </div>
      )}
    </div>
  )
}
