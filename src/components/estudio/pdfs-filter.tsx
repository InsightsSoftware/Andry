'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight, CheckCircle2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Capitulo {
  id: string
  nombre: string
  numero: number
  curso_id: string
}

interface Progreso {
  contenido_id: string
  progreso_porcentaje: number
  completado: boolean
}

interface Pdf {
  id: string
  titulo: string
  capitulo_id: string
  orden: number
}

interface PdfsFilterProps {
  pdfs: Pdf[]
  capitulos: Capitulo[]
  progresoMap: Record<string, Progreso>
}

export function PdfsFilter({ pdfs, capitulos, progresoMap }: PdfsFilterProps) {
  const [search, setSearch] = useState('')
  const [selectedCapitulo, setSelectedCapitulo] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pdfs.filter((pdf) => {
      if (selectedCapitulo && pdf.capitulo_id !== selectedCapitulo) return false
      if (q) {
        const cap = capitulos.find((c) => c.id === pdf.capitulo_id)
        const haystack = `${pdf.titulo} ${cap?.nombre ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [pdfs, capitulos, search, selectedCapitulo])

  const capituloMap = useMemo(
    () => new Map(capitulos.map((c) => [c.id, c])),
    [capitulos]
  )

  const hasFilter = search.trim().length > 0 || selectedCapitulo !== null

  return (
    <div>
      {/* Search + chapter filter */}
      <div className="mb-5 flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar por título o capítulo…'
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Chapter chips */}
        {capitulos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCapitulo(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                selectedCapitulo === null
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-400 hover:text-primary-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
              )}
            >
              Todos
            </button>
            {capitulos
              .slice()
              .sort((a, b) => a.numero - b.numero)
              .map((cap) => (
                <button
                  key={cap.id}
                  onClick={() =>
                    setSelectedCapitulo(selectedCapitulo === cap.id ? null : cap.id)
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                    selectedCapitulo === cap.id
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-400 hover:text-primary-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
                  )}
                >
                  Cap. {cap.numero}
                </button>
              ))}
          </div>
        )}

        {hasFilter && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Mostrando <strong>{filtered.length}</strong> de {pdfs.length} documentos
          </p>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pdf) => {
            const cap = capituloMap.get(pdf.capitulo_id)
            const progress = progresoMap[pdf.id]
            return (
              <Link
                key={pdf.id}
                href={`/estudio/pdf/${pdf.id}`}
                className="group overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 transition-all hover:border-danger-300 dark:hover:border-danger-700 hover:shadow-md cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-danger-500/15 via-danger-600/5 to-neutral-100 dark:from-danger-900/40 dark:via-danger-950/20 dark:to-neutral-900 flex items-center justify-center">
                  <FileText className="h-16 w-16 text-danger-500/70 group-hover:scale-110 transition-transform" />
                  {progress?.completado && (
                    <span className="absolute top-2 right-2 rounded-full bg-success-500 p-1 z-10">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                    {pdf.titulo}
                  </p>
                  {cap && (
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      Cap. {cap.numero} · {cap.nombre}
                    </p>
                  )}
                  {progress && !progress.completado && (
                    <div className="mt-2 h-1 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-1 rounded-full bg-danger-500 transition-all"
                        style={{ width: `${Math.round(progress.progreso_porcentaje)}%` }}
                      />
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400">
                    <span>Abrir PDF</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-1 font-semibold text-neutral-700 dark:text-neutral-300">Sin resultados</p>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            No encontramos PDFs con ese filtro.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCapitulo(null) }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
