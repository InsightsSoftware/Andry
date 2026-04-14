import Link from 'next/link'
import { BookOpen, Users, ArrowRight, Shield, Sparkles } from 'lucide-react'
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
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-white">
          Hola, {firstName}
        </h1>
        <Sparkles className="h-5 w-5 text-primary-400" />
      </div>
      <p className="mb-8 text-neutral-400">
        ¿Qué quieres hacer hoy?
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Study Mode Card */}
        <Link
          href="/estudio"
          className="group relative flex flex-col rounded-2xl p-6 glass-card transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 border border-primary-500/20">
              <BookOpen className="h-7 w-7 text-primary-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">
              Modo Estudio
            </h2>
            <p className="mb-4 flex-1 text-sm text-neutral-400">
              PDF interactivo, audiolibros, videos, banco de preguntas y modo examen cronometrado.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-400 group-hover:gap-2 transition-all">
              Estudiar ahora
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Community Card */}
        <Link
          href="/comunidad/dudas"
          className="group relative flex flex-col rounded-2xl p-6 glass-card transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Users className="h-7 w-7 text-amber-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">
              Comunidad
            </h2>
            <p className="mb-4 flex-1 text-sm text-neutral-400">
              Pregunta dudas de estudio por capítulo y encuentra trabajos con otros contratistas.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400 group-hover:gap-2 transition-all">
              Ir a la comunidad
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </div>

      {/* Admin quick link */}
      {profile?.rol === 'admin' && (
        <Link
          href="/admin/dashboard"
          className="mt-6 flex items-center justify-between rounded-xl p-4 glass glass-hover transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-medium text-neutral-300">
              Panel de Administración
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-500" />
        </Link>
      )}
    </div>
  )
}
