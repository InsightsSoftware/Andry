'use client'

import { useEffect, useRef, useState } from 'react'
import { Phone, Mail, Check, Copy } from 'lucide-react'

interface Props {
  phone?: string | null
  email?: string | null
  /** Coordenadas (viewport) del click en "Contactar" — el pop-up crece desde ahí. */
  origin: { x: number; y: number }
  onClose: () => void
}

const WIDTH = 248

/**
 * Pop-up de contacto que aparece animado desde el punto donde se hizo click.
 * Permite copiar el teléfono o el email al portapapeles.
 */
export function ContactPopover({ phone, email, origin, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<'phone' | 'email' | null>(null)

  // Cerrar al click afuera o con Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  async function copy(type: 'phone' | 'email', value: string) {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* clipboard no disponible (http o permisos) */
    }
    setCopied(type)
    setTimeout(() => setCopied(null), 1600)
  }

  // Posicionar centrado bajo el click, clampeado a la pantalla.
  let left = origin.x - WIDTH / 2
  const top = origin.y + 10
  if (typeof window !== 'undefined') {
    const m = 12
    if (left + WIDTH + m > window.innerWidth) left = window.innerWidth - WIDTH - m
    if (left < m) left = m
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        ref={ref}
        role="menu"
        style={{
          left,
          top,
          width: WIDTH,
          transformOrigin: 'top center',
          animation: 'popover-in 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="fixed rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-2 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Contactar
        </p>

        {phone && (
          <button
            type="button"
            onClick={() => copy('phone', phone)}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <Phone className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-neutral-400 dark:text-neutral-500">
                Teléfono
              </span>
              <span className="block truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {phone}
              </span>
            </span>
            {copied === 'phone' ? (
              <Check className="h-4 w-4 shrink-0 text-success-500" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" />
            )}
          </button>
        )}

        {email && (
          <button
            type="button"
            onClick={() => copy('email', email)}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400">
              <Mail className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-neutral-400 dark:text-neutral-500">
                Email
              </span>
              <span className="block truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {email}
              </span>
            </span>
            {copied === 'email' ? (
              <Check className="h-4 w-4 shrink-0 text-success-500" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" />
            )}
          </button>
        )}

        {copied && (
          <p className="px-2 pb-1 pt-1.5 text-center text-[11px] font-semibold text-success-600 dark:text-success-400">
            ¡Copiado al portapapeles!
          </p>
        )}
      </div>
    </div>
  )
}
