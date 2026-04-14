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
    <aside className="hidden md:flex md:w-64 md:flex-col glass-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
        <GraduationCap className="h-7 w-7 text-primary-400" />
        <span className="text-lg font-bold text-white">
          Contratistas<span className="text-primary-400">Pro</span>
        </span>
      </div>
      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 p-4">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/') ||
            (link.href === '/comunidad/dudas' && pathname.startsWith('/comunidad/'))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'glass-active text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {link.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400" />
              )}
            </Link>
          )
        })}
      </nav>
      {isAdmin && (
        <div className="border-t border-white/5 p-4">
          <Link
            href="/admin/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
              pathname.startsWith('/admin')
                ? 'glass-active text-amber-400'
                : 'text-amber-400/70 hover:text-amber-400 hover:bg-white/[0.04]'
            )}
          >
            <Shield className="h-5 w-5" />
            Panel Admin
          </Link>
        </div>
      )}
      <div className="border-t border-white/5 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-500 hover:text-red-400 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
