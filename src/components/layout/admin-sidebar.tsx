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
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-neutral-200 md:bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
        <GraduationCap className="h-7 w-7 text-primary-600" />
        <span className="text-lg font-bold text-neutral-900">
          Admin<span className="text-primary-600">Panel</span>
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
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-neutral-200 p-4">
        <Link
          href="/panel"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-500 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a la App
        </Link>
      </div>
    </aside>
  )
}
