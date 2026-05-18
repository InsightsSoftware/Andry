'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Headphones,
  ClipboardList,
  Video,
  Handshake,
  Users,
  User,
  LogOut,
  Shield,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

// IA removed from the MVP nav — will return in Fase 2 as part of the
// "Plan Plus" upsell. The /ia route still exists, just hidden.
//
// `excludePrefixes` keeps Modo Estudio from lighting up when the user is on
// /estudio/audios or /estudio/videos (those have their own sidebar links).
type NavLink = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  excludePrefixes?: string[]
}

const links: NavLink[] = [
  { href: '/panel', label: 'Inicio', icon: LayoutDashboard },
  {
    href: '/estudio',
    label: 'Guía',
    icon: BookOpen,
    excludePrefixes: [
      '/estudio/audios',
      '/estudio/videos',
      '/estudio/video',   // player individual
      '/estudio/examen',
      '/estudio/resultados',
      '/practica',
    ],
  },
  { href: '/estudio/audios', label: 'Audios', icon: Headphones },
  { href: '/practica', label: 'Práctica', icon: ClipboardList },
  { href: '/estudio/videos', label: 'Videos', icon: Video },
  { href: '/aliados', label: 'Aliados', icon: Handshake },
  { href: '/comunidad', label: 'Comunidad', icon: Users },
  { href: '/perfil', label: 'Mi Perfil', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

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
          if (data?.rol === 'admin' || data?.rol === 'root') setIsAdmin(true)
        })
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:sticky md:top-0 md:h-screen glass-sidebar">
      <div className="flex h-32 items-center justify-between border-b border-black/5 dark:border-white/5 px-3">
        <Link href="/panel" className="flex items-center">
          <Image
            src="/logo-horizontal.png"
            alt="Y Exam Prep"
            width={400}
            height={400}
            className="h-20 w-auto"
          />
        </Link>
        <ThemeToggle />
      </div>
      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 p-4">
        {links.map((link) => {
          const excluded = (link.excludePrefixes || []).some((p) =>
            pathname.startsWith(p)
          )
          // Exam & results pages live under /estudio/... but belong to Práctica
          const isPracticaPath =
            pathname.startsWith('/estudio/examen/') ||
            pathname.startsWith('/estudio/resultados/')

          const isActive =
            link.href === '/practica'
              ? pathname === '/practica' ||
                pathname.startsWith('/practica/') ||
                isPracticaPath
              : link.href === '/estudio/videos'
              ? pathname.startsWith('/estudio/videos') ||
                pathname.startsWith('/estudio/video/')
              : !excluded &&
                (pathname === link.href ||
                  pathname.startsWith(link.href + '/') ||
                  (link.href === '/comunidad' &&
                    pathname.startsWith('/comunidad/')))
          const Icon = link.icon

          const tourKey =
            link.href === '/aliados'
              ? 'tab-aliados'
              : link.href === '/perfil'
                ? 'tab-perfil'
                : undefined

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              data-tour={tourKey}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'glass-active text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {link.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500 dark:bg-primary-400" />
              )}
            </Link>
          )
        })}
      </nav>
      {isAdmin && (
        <div className="border-t border-black/5 dark:border-white/5 p-4">
          <Link
            href="/admin/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
              pathname.startsWith('/admin')
                ? 'glass-active text-amber-600 dark:text-amber-400'
                : 'text-amber-600/70 dark:text-amber-400/70 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            )}
          >
            <Shield className="h-5 w-5" />
            Panel Admin
          </Link>
        </div>
      )}
      <div className="border-t border-black/5 dark:border-white/5 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
