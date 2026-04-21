'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Handshake,
  Users,
  User,
} from 'lucide-react'

// IA removed from the MVP nav — will return in Fase 2 as part of the
// "Plan Plus" upsell. The /ia page and route still exist, just hidden.
const tabs = [
  { href: '/panel', label: 'Inicio', icon: LayoutDashboard },
  { href: '/estudio', label: 'Estudio', icon: BookOpen },
  { href: '/aliados', label: 'Aliados', icon: Handshake },
  { href: '/comunidad/dudas', label: 'Comunidad', icon: Users },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegación principal" className="fixed bottom-0 left-0 right-0 z-40 glass-nav pb-safe md:hidden">
      <div className="flex items-center justify-around" role="tablist">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/') ||
            (tab.href === '/comunidad/dudas' && pathname.startsWith('/comunidad/'))
          const Icon = tab.icon

          // Data attribute used by the onboarding tour
          const tourKey =
            tab.href === '/aliados'
              ? 'tab-aliados'
              : tab.href === '/perfil'
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
