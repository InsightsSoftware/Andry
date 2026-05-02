import Link from 'next/link'
import Image from 'next/image'
import {
  FileText,
  Headphones,
  ClipboardList,
  Video,
  Handshake,
  Users,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface HomeCard {
  href: string
  label: string
  description: string
  icon: typeof FileText
  accent: string
  iconColor: string
  coverImage: string
  tourKey?: string
}

const HOME_CARDS: HomeCard[] = [
  {
    href: '/estudio',
    label: 'Modo Estudio',
    description: 'Guías PDF con búsqueda y navegación por capítulo',
    icon: FileText,
    accent: 'bg-primary-500/10 border-primary-500/20',
    iconColor: 'text-primary-500 dark:text-primary-400',
    coverImage: '/images/home/pdf.jpg',
    tourKey: 'card-pdf',
  },
  {
    href: '/estudio/audios',
    label: 'Audio Estudio',
    description: 'Audiolibros para estudiar donde sea',
    icon: Headphones,
    accent: 'bg-sky-500/10 border-sky-500/20',
    iconColor: 'text-sky-500 dark:text-sky-400',
    coverImage: '/images/home/audio.jpg',
    tourKey: 'card-audio',
  },
  {
    href: '/practica',
    label: 'Práctica y Examen',
    description: 'Simulacro real con tiempo o práctica libre sin reloj',
    icon: ClipboardList,
    accent: 'bg-success-500/10 border-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400',
    coverImage: '/images/home/practica.jpg',
    tourKey: 'card-practica',
  },
  {
    href: '/estudio/videos',
    label: 'Videos',
    description: 'Tutoriales y explicaciones en video',
    icon: Video,
    accent: 'bg-purple-500/10 border-purple-500/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
    coverImage: '/images/home/videos.jpg',
    tourKey: 'card-videos',
  },
  {
    href: '/aliados',
    label: 'Aliados',
    description: 'Herramientas y recursos de nuestros socios',
    icon: Handshake,
    accent: 'bg-accent-500/10 border-accent-500/20',
    iconColor: 'text-accent-500 dark:text-accent-400',
    coverImage: '/images/home/aliados.jpg',
    tourKey: 'card-aliados',
  },
  {
    href: '/comunidad',
    label: 'Comunidad',
    description: 'Dudas de estudio y oportunidades de trabajo',
    icon: Users,
    accent: 'bg-rose-500/10 border-rose-500/20',
    iconColor: 'text-rose-500 dark:text-rose-400',
    coverImage: '/images/home/comunidad.jpg',
    tourKey: 'card-comunidad',
  },
]

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

      {/* 6 direct-access cards — 2 columns mobile / 3 columns md+ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {HOME_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              data-tour={card.tourKey}
              className="group flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer overflow-hidden"
            >
              {/* Cover image */}
              <div className="relative h-28 sm:h-32 overflow-hidden">
                <Image
                  src={card.coverImage}
                  alt={card.label}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className={`absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-lg border ${card.accent} backdrop-blur-sm`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-tight">
                  {card.label}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 flex-1">
                  {card.description}
                </p>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600 transition-all duration-200 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
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
