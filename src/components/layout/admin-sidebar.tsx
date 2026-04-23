'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Users,
  FileText,
  HelpCircle,
  CreditCard,
  ArrowLeft,
  Handshake,
  Headphones,
  Video,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const links = [
  { href: '/admin/dashboard', label: 'Métricas', icon: BarChart3 },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/contenido', label: 'Cursos', icon: FileText },
  { href: '/admin/pdfs', label: 'PDFs', icon: FileText },
  { href: '/admin/audios', label: 'Audios', icon: Headphones },
  { href: '/admin/videos', label: 'Videos', icon: Video },
  { href: '/admin/preguntas', label: 'Preguntas', icon: HelpCircle },
  { href: '/admin/partners', label: 'Aliados', icon: Handshake },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:sticky md:top-0 md:h-screen md:w-64 md:flex md:flex-col glass-sidebar">
      <div className="flex h-32 items-center justify-between border-b border-black/5 dark:border-white/5 px-3">
        <Link href="/admin/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Y Exam Prep Admin"
            width={280}
            height={84}
            className="h-24 w-auto"
          />
        </Link>
        <ThemeToggle />
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
                  ? 'glass-active text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500 dark:bg-primary-400" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-black/5 dark:border-white/5 p-4">
        <Link
          href="/panel"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all duration-200"
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
        <Image
          src="/logo.png"
          alt="Y Exam Prep Admin"
          width={240}
          height={72}
          className="h-16 w-auto"
        />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/panel"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 glass glass-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            App
          </Link>
        </div>
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
                  ? 'glass-active text-primary-600 dark:text-primary-400'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
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
