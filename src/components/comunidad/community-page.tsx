'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MessageCircle, Briefcase, Plus, Sparkles } from 'lucide-react'
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
        /* Empty state — cinematic hero image + CTA overlay */
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg">
          <Image
            src={isDuda ? '/images/community/dudas.png' : '/images/community/trabajos.png'}
            alt={isDuda ? 'Contratistas estudiando juntos' : 'Contratistas cerrando un trato'}
            width={2752}
            height={1536}
            priority
            className="h-[280px] w-full object-cover sm:h-[360px]"
          />
          {/* Dark gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-300 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {isDuda ? 'Espacio de estudio' : 'Red de contratistas'}
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl">
              {isDuda
                ? 'Aprendé más rápido en comunidad'
                : 'Conectá con otros contratistas'}
            </h2>
            <p className="mb-5 max-w-xl text-sm text-neutral-200 sm:text-base">
              {isDuda
                ? 'Preguntá dudas del examen, compartí tips y resolvé con gente que ya pasó por lo mismo. Sé el primero en abrir el hilo.'
                : 'Publicá tus trabajos, encontrá subcontratistas de plomería, electricidad, HVAC. Este es tu tablero.'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-900/30 transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              {isDuda ? 'Publicar mi primera duda' : 'Publicar mi primer trabajo'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
