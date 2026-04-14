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
  GraduationCap,
  LogOut,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useState, useEffect } from 'react'

const links = [
  { href: '/panel', label: 'Inicio', icon: LayoutDashboard },
  { href: '/estudio', label: 'Modo Estudio', icon: BookOpen },
  { href: '/ia', label: 'Asistente IA', icon: Bot },
  { href: '/comunidad/dudas', label: 'Comunidad', icon: Users },
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
          if (data?.rol === 'admin') setIsAdmin(true)
        })
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-neutral-200 dark:border-neutral-700 md:bg-white dark:bg-neutral-900">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 px-6">
        <GraduationCap className="h-7 w-7 text-primary-600" />
        <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Contratistas<span className="text-primary-600">Pro</span>
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/') ||
            (link.href === '/comunidad/dudas' && pathname.startsWith('/comunidad/'))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <ThemeToggle />
      </div>
      {isAdmin && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
          <Link
            href="/admin/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                : 'text-warning-600 dark:text-warning-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            )}
          >
            <Shield className="h-5 w-5" />
            Panel Admin
          </Link>
        </div>
      )}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-danger-500 dark:hover:text-danger-400 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
