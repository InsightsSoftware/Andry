import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { ThemeToggleCompact } from '@/components/ui/theme-toggle'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Contratistas<span className="text-primary-600">Pro</span>
          </span>
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/precios"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Precios
          </Link>
          <ThemeToggleCompact />
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Comenzar Ahora
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Comenzar
          </Link>
        </div>
      </div>
    </nav>
  )
}
