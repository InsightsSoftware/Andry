import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 glass-nav">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-4">
        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/precios"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Precios
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Iniciar Sesión
          </Link>
          <ThemeToggle />
          <Link
            href="/registro"
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
          >
            Comenzar Ahora
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400"
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
