import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 glass-nav">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo / Home */}
        <Link href="/" className="flex items-center gap-2 shrink-0 cursor-pointer">
          <Image src="/logo.png" alt="Y Exam Prep" width={32} height={32} className="h-8 w-auto" />
          <span className="hidden sm:block text-sm font-semibold text-neutral-900 dark:text-white">
            Y Exam Prep
          </span>
        </Link>

        {/* Desktop nav */}
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
            href="/precios"
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
          >
            Comenzar Ahora
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-3 sm:hidden">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400"
          >
            Entrar
          </Link>
          <Link
            href="/precios"
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Comenzar
          </Link>
        </div>
      </div>
    </nav>
  )
}
