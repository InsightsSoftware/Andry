import Link from 'next/link'
import {
  BookOpen,
  ArrowRight,
  Headphones,
  Video,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Modo Estudio' }

export default async function EstudioPage() {
  const supabase = await createClient()
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug, descripcion, imagen_url')
    .eq('activo', true)
    .order('orden')

  // Quick stats for the audio/video shortcuts (so mobile users — who don't
  // see the desktop sidebar — can still discover these sections).
  const { count: totalAudios } = await supabase
    .from('contenido')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'audio')

  const { count: totalVideos } = await supabase
    .from('contenido')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'video')

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Modo Estudio
      </h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        Selecciona un curso para comenzar a estudiar
      </p>

      {/* Quick access — Audios / Videos.
          Prominent on mobile (where sidebar is hidden). On desktop acts as a
          redundant entry point so the sections feel first-class. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/estudio/audios"
          className="group relative overflow-hidden rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-gradient-to-br from-primary-50 to-primary-100/40 dark:from-primary-900/30 dark:to-primary-900/5 p-5 transition-all hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
              <Headphones className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Audios
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {totalAudios ?? 0} audiolibros disponibles
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/estudio/videos"
          className="group relative overflow-hidden rounded-2xl border border-success-200 dark:border-success-800/60 bg-gradient-to-br from-success-50 to-success-100/40 dark:from-success-900/30 dark:to-success-900/5 p-5 transition-all hover:shadow-lg hover:border-success-300 dark:hover:border-success-700 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
              <Video className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Videos
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {totalVideos ?? 0} videos disponibles
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-success-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Cursos
      </h2>

      {cursos && cursos.length > 0 ? (
        <div className="flex flex-col gap-4">
          {cursos.map((curso) => (
            <Link
              key={curso.id}
              href={`/estudio/${curso.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <BookOpen className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">{curso.nombre}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{curso.descripcion}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Los cursos se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      )}
    </div>
  )
}
