import { GraduationCap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary-600" />
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              Contratistas<span className="text-primary-600">Pro</span>
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} ContratistasPro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
