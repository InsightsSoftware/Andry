import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 glass-nav">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary-400" />
          <span className="text-xl font-bold text-white">
            Contratistas<span className="text-primary-400">Pro</span>
          </span>
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/precios"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Precios
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
          >
            Comenzar Ahora
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-400"
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
