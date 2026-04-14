'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Users,
  User,
} from 'lucide-react'

const tabs = [
  { href: '/panel', label: 'Inicio', icon: LayoutDashboard },
  { href: '/estudio', label: 'Estudio', icon: BookOpen },
  { href: '/ia', label: 'IA', icon: Bot },
  { href: '/comunidad/dudas', label: 'Comunidad', icon: Users },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white pb-safe md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/') ||
            (tab.href === '/comunidad/dudas' && pathname.startsWith('/comunidad/'))
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2.5 min-w-[64px] min-h-[48px] justify-center',
                'transition-colors duration-150',
                isActive
                  ? 'text-primary-600'
                  : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn('text-[10px]', isActive && 'font-semibold')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
