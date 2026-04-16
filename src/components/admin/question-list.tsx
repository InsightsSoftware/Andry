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
      <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center">
        <p className="text-neutral-500">No hay preguntas en el banco</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl glass-card divide-y divide-black/5 dark:divide-white/5">
      {questions.map((q) => (
        <div key={q.id} className="px-4 py-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() =>
                setExpandedId(expandedId === q.id ? null : q.id)
              }
              className="mt-0.5 shrink-0 text-neutral-500 cursor-pointer"
            >
              {expandedId === q.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-700 dark:text-neutral-200 truncate">
                {q.texto}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                <span className="font-mono font-bold text-primary-400 uppercase">
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
              className="shrink-0 rounded-lg p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {expandedId === q.id && (
            <div className="mt-2 ml-7 text-xs text-neutral-600 dark:text-neutral-400 bg-black/[0.03] dark:bg-white/[0.02] rounded-lg p-3 border border-black/5 dark:border-white/5">
              <p className="mb-1 whitespace-pre-wrap">{q.texto}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
