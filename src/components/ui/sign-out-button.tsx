'use client'

import { useState, useTransition } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { signOut } from '@/actions/auth'

export function SignOutButton() {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch gap-2 rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-4">
        <p className="flex-1 text-sm text-danger-700 dark:text-danger-400 self-center">
          ¿Seguro que querés cerrar sesión?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => startTransition(() => signOut())}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-danger-300 dark:hover:border-danger-700 hover:text-danger-600 dark:hover:text-danger-400 transition-colors cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  )
}
