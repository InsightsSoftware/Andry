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
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">
        Hola, {firstName}
      </h1>
      <p className="mb-8 text-neutral-500">
        ¿Qué quieres hacer hoy?
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Study Mode Card */}
        <Link
          href="/estudio"
          className="group flex flex-col rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 transition-shadow hover:shadow-lg active:shadow-md"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
            <BookOpen className="h-7 w-7 text-primary-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900">
            Modo Estudio
          </h2>
          <p className="mb-4 flex-1 text-sm text-neutral-600">
            PDF interactivo, audiolibros, videos, banco de preguntas y modo examen cronometrado.
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:gap-2 transition-all">
            Estudiar ahora
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        {/* Community Card */}
        <Link
          href="/comunidad/dudas"
          className="group flex flex-col rounded-2xl border-2 border-accent-400/30 bg-gradient-to-br from-accent-50 to-white p-6 transition-shadow hover:shadow-lg active:shadow-md"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50">
            <Users className="h-7 w-7 text-accent-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900">
            Comunidad
          </h2>
          <p className="mb-4 flex-1 text-sm text-neutral-600">
            Pregunta dudas de estudio por capítulo y encuentra trabajos con otros contratistas.
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-500 group-hover:gap-2 transition-all">
            Ir a la comunidad
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Admin quick link */}
      {profile?.rol === 'admin' && (
        <Link
          href="/admin/dashboard"
          className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 transition-colors"
        >
          <span className="text-sm font-medium text-neutral-700">
            Panel de Administración
          </span>
          <ArrowRight className="h-4 w-4 text-neutral-400" />
        </Link>
      )}
    </div>
  )
}
