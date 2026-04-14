import Link from 'next/link'
import { BookOpen, Users, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, rol')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.nombre_completo?.split(' ')[0] || 'Estudiante'

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Hola, {firstName}
      </h1>
      <p className="mb-8 text-neutral-500 dark:text-neutral-400">
        ¿Qué quieres hacer hoy?
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Study Mode Card */}
        <Link
          href="/estudio"
          className="group flex flex-col rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-neutral-900 p-6 transition-shadow hover:shadow-lg active:shadow-md"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-800/30">
            <BookOpen className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Modo Estudio
          </h2>
          <p className="mb-4 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
            PDF interactivo, audiolibros, videos, banco de preguntas y modo examen cronometrado.
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
            Estudiar ahora
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        {/* Community Card */}
        <Link
          href="/comunidad/dudas"
          className="group flex flex-col rounded-2xl border-2 border-accent-400/30 dark:border-accent-400/20 bg-gradient-to-br from-accent-50 to-white dark:from-accent-900/20 dark:to-neutral-900 p-6 transition-shadow hover:shadow-lg active:shadow-md"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 dark:bg-accent-400/10">
            <Users className="h-7 w-7 text-accent-500 dark:text-accent-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Comunidad
          </h2>
          <p className="mb-4 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
            Pregunta dudas de estudio por capítulo y encuentra trabajos con otros contratistas.
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-500 dark:text-accent-400 group-hover:gap-2 transition-all">
            Ir a la comunidad
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Admin quick link */}
      {profile?.rol === 'admin' && (
        <Link
          href="/admin/dashboard"
          className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Panel de Administración
          </span>
          <ArrowRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
        </Link>
      )}
    </div>
  )
}
