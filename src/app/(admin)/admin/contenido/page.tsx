import { FileText } from 'lucide-react'

export const metadata = { title: 'Admin - Contenido' }

export default function AdminContentPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">
        Gestión de Contenido
      </h1>
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
        <p className="mb-4 text-neutral-500">
          Sube y gestiona PDFs, audiolibros y videos aquí.
        </p>
        <button className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 min-h-[48px]">
          Subir Contenido
        </button>
      </div>
    </div>
  )
}
