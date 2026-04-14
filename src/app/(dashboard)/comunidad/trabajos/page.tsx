import { Briefcase } from 'lucide-react'

export const metadata = { title: 'Comunidad - Trabajos' }

export default function TrabajosPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Trabajos
          </h1>
          <p className="text-sm text-neutral-500">
            Encuentra y publica oportunidades de trabajo
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-2 border-b border-neutral-200">
        <a
          href="/comunidad/dudas"
          className="px-4 py-3 text-sm font-medium text-neutral-500 hover:text-neutral-700"
        >
          Dudas
        </a>
        <button className="border-b-2 border-primary-600 px-4 py-3 text-sm font-semibold text-primary-600">
          Trabajos
        </button>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
        <Briefcase className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
        <h2 className="mb-1 font-bold text-neutral-700">
          Aún no hay trabajos publicados
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Publica tu primer trabajo o busca oportunidades con otros contratistas.
        </p>
        <button className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 min-h-[48px]">
          Publicar Trabajo
        </button>
      </div>
    </div>
  )
}
