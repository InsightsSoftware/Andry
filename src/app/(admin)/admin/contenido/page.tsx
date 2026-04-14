import { FileText } from 'lucide-react'

export const metadata = { title: 'Admin - Contenido' }

export default function AdminContentPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Gestión de Contenido
      </h1>
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
        <p className="mb-4 text-neutral-500 dark:text-neutral-400">
          Sube y gestiona PDFs, audiolibros y videos aquí.
        </p>
        <button className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 min-h-[48px]">
          Subir Contenido
        </button>
      </div>
    </div>
  )
}
