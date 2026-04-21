'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Briefcase, Plus } from 'lucide-react'
import { PostForm } from './post-form'
import { PostCard } from './post-card'

interface Comment {
  id: string
  contenido: string
  created_at: string
  profiles: { nombre_completo: string } | null
}

interface Post {
  id: string
  titulo: string
  contenido: string
  tipo: 'duda' | 'trabajo'
  ubicacion: string | null
  presupuesto: string | null
  resuelto: boolean
  created_at: string
  profiles: { nombre_completo: string } | null
  comentarios: Comment[]
}

interface CommunityPageProps {
  tipo: 'duda' | 'trabajo'
  posts: Post[]
}

export function CommunityPage({ tipo, posts }: CommunityPageProps) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const isDuda = tipo === 'duda'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isDuda ? 'Dudas de Estudio' : 'Trabajos'}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {isDuda
              ? 'Pregunta y resuelve dudas con otros estudiantes'
              : 'Encuentra y publica oportunidades de trabajo'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isDuda ? 'Nueva Duda' : 'Nuevo Trabajo'}
          </span>
        </button>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
        <a
          href="/comunidad/dudas"
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
            isDuda
              ? 'border-b-2 border-primary-600 dark:border-primary-400 font-semibold text-primary-600 dark:text-primary-400'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Dudas
        </a>
        <a
          href="/comunidad/trabajos"
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
            !isDuda
              ? 'border-b-2 border-primary-600 dark:border-primary-400 font-semibold text-primary-600 dark:text-primary-400'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Trabajos
        </a>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="mb-6">
          <PostForm
            tipo={tipo}
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false)
              router.refresh()
            }}
          />
        </div>
      )}

      {/* Posts list */}
      {posts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          {isDuda ? (
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          ) : (
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          )}
          <h2 className="mb-1 font-bold text-neutral-700 dark:text-neutral-300">
            {isDuda
              ? 'Aún no hay dudas publicadas'
              : 'Aún no hay trabajos publicados'}
          </h2>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            {isDuda
              ? 'Sé el primero en hacer una pregunta sobre el material.'
              : 'Publicá tu primer trabajo o buscá oportunidades.'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 min-h-[48px]"
          >
            {isDuda ? 'Publicar Duda' : 'Publicar Trabajo'}
          </button>
        </div>
      )}
    </div>
  )
}
