'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  User,
  Handshake,
} from 'lucide-react'

// IA removed from the MVP nav — will return in Fase 2 as part of the
// "Plan Plus" upsell. The /ia page and route still exist, just hidden.
// Aliados removed from mobile tabs (accessible via desktop sidebar) —
// replaced by Práctica which is a core daily-use feature.
const tabs = [
  { href: '/panel',     label: 'Inicio',     icon: LayoutDashboard },
  { href: '/estudio',   label: 'Guía',       icon: BookOpen },
  { href: '/practica',  label: 'Práctica',   icon: ClipboardList },
  { href: '/comunidad', label: 'Comunidad',  icon: Users },
  { href: '/perfil',    label: 'Perfil',     icon: User },
]

// CC role only sees these 3 tabs
const CC_TABS = [
  { href: '/comunidad', label: 'Comunidad', icon: Users },
  { href: '/aliados',   label: 'Aliados',   icon: Handshake },
  { href: '/perfil',    label: 'Perfil',    icon: User },
]

export function BottomTabs() {
  const pathname = usePathname()
  const [isComunidad, setIsComunidad] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.rol === 'comunidad') setIsComunidad(true)
        })
    })
  }, [])

  const visibleTabs = isComunidad ? CC_TABS : tabs

  return (
    <nav aria-label="Navegación principal" className="fixed bottom-0 left-0 right-0 z-40 glass-nav pb-safe md:hidden">
      <div className="flex items-center justify-around" role="tablist">
        {visibleTabs.map((tab) => {
          // Exam & results pages live under /estudio/... but belong to Práctica tab
          const isPracticaPath =
            pathname.startsWith('/estudio/examen/') ||
            pathname.startsWith('/estudio/resultados/')

          const isActive =
            tab.href === '/practica'
              ? pathname === '/practica' ||
                pathname.startsWith('/practica/') ||
                isPracticaPath
              : tab.href === '/estudio'
                ? !isPracticaPath &&
                  (pathname === '/estudio' || pathname.startsWith('/estudio/'))
                : pathname === tab.href || pathname.startsWith(tab.href + '/')
          const Icon = tab.icon

          // Data attribute used by the onboarding tour
          const tourKey =
            tab.href === '/perfil'
              ? 'tab-perfil'
              : undefined

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              data-tour={tourKey}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2.5 min-w-[64px] min-h-[48px] justify-center',
                'transition-all duration-200',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 1.5} aria-hidden="true" />
              <span className={cn('text-[10px]', isActive && 'font-semibold')}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary-600 dark:bg-primary-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
