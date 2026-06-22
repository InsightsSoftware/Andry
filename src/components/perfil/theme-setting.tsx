'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
] as const

export function ThemeSetting() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Avoid hydration mismatch: don't highlight anything until mounted.
  const theme = mounted ? resolvedTheme : undefined

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {theme === 'dark' ? (
          <Moon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
        ) : (
          <Sun className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
        )}
        <span className="text-sm text-neutral-700 dark:text-neutral-300">Tema de la app</span>
      </div>

      <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-800/60 p-0.5">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer',
                active
                  ? 'bg-white text-primary-600 shadow-sm dark:bg-neutral-900 dark:text-primary-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
