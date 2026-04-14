'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { deleteQuestion } from '@/actions/admin'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  texto: string
  respuesta_correcta: string
  pagina_libro: number | null
  capitulo_id: string
  capitulos: { nombre: string; cursos: { nombre: string } | null } | null
}

export function QuestionList({ questions }: { questions: Question[] }) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    setDeleting(id)
    await deleteQuestion(id)
    setDeleting(null)
    router.refresh()
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-8 text-center">
        <p className="text-neutral-400 dark:text-neutral-500">
          No hay preguntas en el banco
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
      {questions.map((q) => (
        <div key={q.id} className="px-4 py-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() =>
                setExpandedId(expandedId === q.id ? null : q.id)
              }
              className="mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-500 cursor-pointer"
            >
              {expandedId === q.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                {q.texto}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                <span className="font-mono font-bold text-primary-600 dark:text-primary-400 uppercase">
                  Resp: {q.respuesta_correcta}
                </span>
                {q.pagina_libro && <span>Pág. {q.pagina_libro}</span>}
                <span>
                  {q.capitulos?.cursos?.nombre} → {q.capitulos?.nombre}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(q.id)}
              disabled={deleting === q.id}
              className="shrink-0 rounded-lg p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {expandedId === q.id && (
            <div className="mt-2 ml-7 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
              <p className="mb-1 whitespace-pre-wrap">{q.texto}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
