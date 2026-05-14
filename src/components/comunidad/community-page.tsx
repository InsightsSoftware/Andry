'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Search, X, Filter } from 'lucide-react'
import { PostForm } from './post-form'
import { PostCard } from './post-card'
import { ComunidadTour } from '@/components/tour/section-tours'

// FL contractor license types — matching is case-insensitive substring
// against the post title + content.
const OFICIOS = [
  { key: 'general', label: 'General Contractor', match: /general\s*contractor/i },
  { key: 'building', label: 'Building Contractor', match: /building\s*contractor/i },
  { key: 'residential', label: 'Residential Contractor', match: /residential\s*contractor/i },
  { key: 'electrical', label: 'Electrical Contractor', match: /electric/i },
  { key: 'specialty-electrical', label: 'Specialty Residential Electrical', match: /specialty.*electric|electric.*specialty/i },
  { key: 'ac-a', label: 'Class A Air-Conditioning', match: /class\s*a.*air|a\/c.*class\s*a|air.cond/i },
  { key: 'ac-b', label: 'Class B Air-Conditioning', match: /class\s*b.*air|a\/c.*class\s*b/i },
  { key: 'plumbing', label: 'Plumbing Contractor', match: /plumb|plomer|pipe/i },
  { key: 'solar', label: 'Solar Contractor', match: /solar/i },
] as const

type OficioKey = (typeof OFICIOS)[number]['key']

interface Profile {
  nombre_completo: string
  es_mentor?: boolean | null
  oficio?: string | null
  ubicacion?: string | null
  rol?: string | null
}

interface Comment {
  id: string
  contenido: string
  created_at: string
  profiles: Profile | null
}

interface Post {
  id: string
  user_id: string
  titulo: string
  contenido: string
  tipo: 'duda' | 'trabajo'
  ubicacion: string | null
  presupuesto: string | null
  resuelto: boolean
  pinned?: boolean
  created_at: string
  profiles: Profile | null
  comentarios: Comment[]
}

interface CommunityPageProps {
  tipo: 'duda' | 'trabajo'
  posts: Post[]
  currentUserId?: string
  currentUserName?: string
  currentUserAvatar?: string
  isAdmin?: boolean
}

export function CommunityPage({ tipo, posts, currentUserId, currentUserName, currentUserAvatar, isAdmin }: CommunityPageProps) {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [oficio, setOficio] = useState<OficioKey | null>(null)
  const router = useRouter()
  const isDuda = tipo === 'duda'

  // Client-side filtering: posts are already fetched server-side, we
  // just narrow the list. Title is primary signal, content is secondary.
  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const oficioMatcher = oficio
      ? OFICIOS.find((o) => o.key === oficio)?.match
      : null

    return posts.filter((post) => {
      if (query) {
        const haystack = `${post.titulo} ${post.contenido}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (oficioMatcher) {
        const haystack = `${post.titulo} ${post.contenido}`
        if (!oficioMatcher.test(haystack)) return false
      }
      return true
    })
  }, [posts, search, oficio])

  const hasActiveFilter = search.trim().length > 0 || oficio !== null

  return (
    <div data-tour="comunidad-root">
      <ComunidadTour />
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
          data-tour="comunidad-post-form"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isDuda ? 'Nueva Duda' : 'Nuevo Trabajo'}
          </span>
        </button>
      </div>

      {/* Search + filter bar — always visible */}
      {(
        <div className="mb-5 flex flex-col gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isDuda
                  ? 'Buscar por título: ej. "cálculo breaker"...'
                  : 'Buscar por título: ej. "electricidad Miami"...'
              }
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              aria-label="Buscar por título"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Licencia filter — only on Trabajos tab, shown as dropdown */}
          {!isDuda && (
            <div data-tour="comunidad-filters" className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <div className="relative flex-1 sm:max-w-xs">
                <select
                  value={oficio ?? ''}
                  onChange={(e) => setOficio((e.target.value as OficioKey) || null)}
                  className={`w-full appearance-none rounded-xl border py-2.5 pl-3 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer ${
                    oficio
                      ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300 font-medium'
                      : 'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
                  }`}
                >
                  <option value="">Todas las licencias</option>
                  {OFICIOS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              {oficio && (
                <button
                  onClick={() => setOficio(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                  aria-label="Limpiar filtro"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Result count line */}
          {hasActiveFilter && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Mostrando <strong>{filteredPosts.length}</strong> de {posts.length}{' '}
              {isDuda ? 'dudas' : 'trabajos'}
            </p>
          )}
        </div>
      )}

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
      {filteredPosts.length > 0 ? (
        <div data-tour="comunidad-post-list" className="flex flex-col gap-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} currentUserName={currentUserName} currentUserAvatar={currentUserAvatar} isAdmin={isAdmin} />
          ))}
        </div>
      ) : posts.length > 0 && filteredPosts.length === 0 ? (
        /* Filter returned nothing */
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-1 font-semibold text-neutral-700 dark:text-neutral-300">
            Sin resultados
          </p>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            No encontramos {isDuda ? 'dudas' : 'trabajos'} con esos filtros.
          </p>
          <button
            onClick={() => {
              setSearch('')
              setOficio(null)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
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
