'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, CheckCircle2, FileText } from 'lucide-react'

interface ChapterAccordionProps {
  numero: number
  nombre: string
  descripcion: string | null
  completed: boolean
  progress: number
  itemCount: number
  /** True if this chapter has at least one PDF — shows a "Guía" badge on
   *  the collapsed header so the user sees at a glance which chapters
   *  already have the study guide available. */
  hasGuia?: boolean
  children: React.ReactNode
}

export function ChapterAccordion({
  numero,
  nombre,
  descripcion,
  completed,
  progress,
  itemCount,
  hasGuia = false,
  children,
}: ChapterAccordionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
      >
        {/* Chapter number badge */}
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
            completed
              ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          )}
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            numero
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {nombre}
            </h3>
            {hasGuia && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger-50 dark:bg-danger-900/30 px-2 py-0.5 text-[10px] font-semibold text-danger-600 dark:text-danger-400">
                <FileText className="h-2.5 w-2.5" />
                Guía
              </span>
            )}
          </div>
          {descripcion && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
              {descripcion}
            </p>
          )}
          {/* Mini progress bar */}
          {itemCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    completed
                      ? 'bg-success-500'
                      : 'bg-primary-600 dark:bg-primary-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
                {progress}%
              </span>
            </div>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-neutral-400 dark:text-neutral-500 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Content items */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-neutral-100 dark:border-neutral-800 p-3">
          {children}
        </div>
      </div>
    </div>
  )
}
