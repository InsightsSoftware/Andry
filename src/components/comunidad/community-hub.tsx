import Link from 'next/link'
import Image from 'next/image'
import { MessageCircleQuestion, Briefcase, ArrowRight } from 'lucide-react'

const CARDS = [
  {
    href: '/comunidad/dudas',
    label: 'Foro de Estudio',
    description: 'Consulta tus dudas y responde las de otros colegas.',
    image: '/images/community/dudas.png',
    icon: MessageCircleQuestion,
    iconColor: 'text-purple-300',
    iconBg: 'bg-purple-500/20 border-purple-500/30',
    cta: 'Ver dudas',
    ctaClass: 'bg-purple-600 hover:bg-purple-500 text-white',
  },
  {
    href: '/comunidad/trabajos',
    label: 'Trabajos',
    description: 'Encuentra oportunidades laborales, proyectos y subcontratos.',
    image: '/images/community/trabajos.png',
    icon: Briefcase,
    iconColor: 'text-amber-300',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    cta: 'Ver trabajos',
    ctaClass: 'bg-amber-600 hover:bg-amber-500 text-white',
  },
]

export function CommunityHub() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.href}
            href={card.href}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer min-h-[220px]"
          >
            {/* Cover image */}
            <div className="relative h-40 overflow-hidden flex-shrink-0">
              <Image
                src={card.image}
                alt={card.label}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Icon badge */}
              <div className={`absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl border ${card.iconBg} backdrop-blur-sm`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} aria-hidden="true" />
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                {card.label}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed flex-1">
                {card.description}
              </p>
              <div className={`inline-flex items-center gap-1.5 self-start mt-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${card.ctaClass}`}>
                {card.cta}
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
