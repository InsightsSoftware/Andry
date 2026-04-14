'use client'

import { AlertTriangle } from 'lucide-react'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 max-w-md shadow-lg">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-warning-500" />
        <h2 className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Algo salió mal
        </h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          {error.message || 'Ocurrió un error inesperado. Por favor intenta de nuevo.'}
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors cursor-pointer"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
