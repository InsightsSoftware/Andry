'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Loader2, CheckCircle2 } from 'lucide-react'
import { joinWaitlist } from '@/actions/waitlist'

/**
 * Reemplaza al botón de compra cuando los cupos están agotados.
 * En vez de un botón muerto, invita a dejar el correo (lista de espera).
 */
export function CuposAgotadosBtn({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-accent-500/40 bg-accent-500/10 px-6 py-3.5 text-sm font-semibold text-accent-600 dark:text-accent-300 hover:bg-accent-500/20 transition-colors cursor-pointer"
        >
          <Bell className="h-4 w-4 shrink-0" />
          Avisame cuando haya lugar
        </button>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Cupos agotados · próximamente se amplían las vacantes
        </p>
      </div>

      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}

function WaitlistModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState('')

  // Cerrar con Esc + bloquear scroll del fondo
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('loading')
    const result = await joinWaitlist(email)
    if ('error' in result) {
      setError(result.error)
      setStatus('idle')
      return
    }
    setStatus('done')
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Lista de espera"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {status === 'done' ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-500/15">
              <CheckCircle2 className="h-7 w-7 text-success-500" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              ¡Listo!
            </h3>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              Te vamos a avisar apenas se amplíen los cupos.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15">
                <Bell className="h-5 w-5 text-accent-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Cupos agotados por ahora
              </h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              Dejanos tu correo y te avisamos{' '}
              <strong className="text-neutral-700 dark:text-neutral-300">
                apenas se amplíen los lugares
              </strong>
              .
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
              {error && (
                <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-xs text-danger-600 dark:text-danger-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  'Avisame cuando haya lugar'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
