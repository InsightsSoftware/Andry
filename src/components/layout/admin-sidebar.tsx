'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Users,
  FileText,
  HelpCircle,
  CreditCard,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react'

const links = [
  { href: '/admin/dashboard', label: 'Métricas', icon: BarChart3 },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/contenido', label: 'Contenido', icon: FileText },
  { href: '/admin/preguntas', label: 'Preguntas', icon: HelpCircle },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col glass-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
        <GraduationCap className="h-7 w-7 text-primary-400" />
        <span className="text-lg font-bold text-white">
          Admin<span className="text-primary-400">Panel</span>
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/')
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'glass-active text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/5 p-4">
        <Link
          href="/panel"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-500 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a la App
        </Link>
      </div>
    </aside>
  )
}

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden sticky top-0 z-40 glass-nav">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary-400" />
          <span className="text-base font-bold text-white">
            Admin<span className="text-primary-400">Panel</span>
          </span>
        </div>
        <Link
          href="/panel"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 glass glass-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          App
        </Link>
      </div>
      <nav className="flex overflow-x-auto gap-1 px-3 pb-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/')
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-200',
                isActive
                  ? 'glass-active text-primary-400'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
