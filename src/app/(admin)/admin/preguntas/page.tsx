import { HelpCircle, Upload } from 'lucide-react'

export const metadata = { title: 'Admin - Preguntas' }

export default function AdminQuestionsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Banco de Preguntas
        </h1>
        <button className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 min-h-[48px]">
          <Upload className="h-4 w-4" />
          Subir CSV
        </button>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
        <HelpCircle className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
        <p className="mb-2 text-neutral-500 dark:text-neutral-400">
          Sube preguntas desde un archivo CSV por capítulo.
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Formato: texto, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, pagina_libro
        </p>
      </div>
    </div>
  )
}
