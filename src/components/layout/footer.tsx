import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/5 bg-neutral-50/80 dark:bg-neutral-950/80 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Image
            src="/logo.png"
            alt="Y Exam Prep"
            width={280}
            height={84}
            className="h-20 w-auto"
          />
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <Link
              href="/seguridad"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              Seguridad y Privacidad
            </Link>
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} Y Exam Prep. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
