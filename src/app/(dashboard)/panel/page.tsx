import Link from 'next/link'
import { BookOpen, Users, ArrowRight, Shield, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HeroVideo } from '@/components/ui/hero-video'

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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Hola, {firstName}
        </h1>
        <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <p className="mb-8 text-neutral-500 dark:text-neutral-400">
        ¿Qué quieres hacer hoy?
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Study Mode Card — cinematic animated hero */}
        <Link
          href="/estudio"
          className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary-900/30 dark:border-neutral-800 sm:min-h-[320px]"
        >
          <HeroVideo
            src="/videos/home/estudio.mp4"
            poster="/images/home/estudio.png"
            alt="Contratista estudiando concentrado"
            width={2528}
            height={1696}
            priority
            className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          {/* Dark gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10" />
          {/* Purple accent tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent mix-blend-overlay" />

          {/* Content */}
          <div className="relative p-5 sm:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary-400/40 bg-primary-500/20 backdrop-blur-sm">
              <BookOpen className="h-5 w-5 text-primary-200" />
            </div>
            <h2 className="mb-1.5 text-xl font-extrabold text-white drop-shadow-lg sm:text-2xl">
              Modo Estudio
            </h2>
            <p className="mb-3 text-sm text-neutral-200 drop-shadow">
              PDF interactivo, audiolibros, videos, banco de preguntas y examen cronometrado.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-200 transition-all group-hover:gap-2 group-hover:text-primary-100">
              Estudiar ahora
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Community Card — cinematic animated hero */}
        <Link
          href="/comunidad/dudas"
          className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-accent-900/30 dark:border-neutral-800 sm:min-h-[320px]"
        >
          <HeroVideo
            src="/videos/home/comunidad.mp4"
            poster="/images/home/comunidad.png"
            alt="Contratistas conversando en una obra"
            width={2528}
            height={1696}
            priority
            className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500/25 to-transparent mix-blend-overlay" />

          <div className="relative p-5 sm:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-accent-300/50 bg-accent-500/20 backdrop-blur-sm">
              <Users className="h-5 w-5 text-accent-200" />
            </div>
            <h2 className="mb-1.5 text-xl font-extrabold text-white drop-shadow-lg sm:text-2xl">
              Comunidad
            </h2>
            <p className="mb-3 text-sm text-neutral-200 drop-shadow">
              Dudas de estudio por capítulo y trabajos con otros contratistas.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-accent-200 transition-all group-hover:gap-2 group-hover:text-accent-100">
              Ir a la comunidad
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </div>

      {/* Admin quick link */}
      {(profile?.rol === 'admin' || profile?.rol === 'root') && (
        <Link
          href="/admin/dashboard"
          className="mt-6 flex items-center justify-between rounded-xl p-4 glass glass-hover transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Panel de Administración
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
        </Link>
      )}
    </div>
  )
}
