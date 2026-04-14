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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-neutral-200 md:bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
        <GraduationCap className="h-7 w-7 text-primary-600" />
        <span className="text-lg font-bold text-neutral-900">
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
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-danger-500 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
