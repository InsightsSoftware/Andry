import { Users, MessageCircle, Briefcase, CheckCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AvatarInicial } from './avatar-inicial'

interface StatBox {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

/**
 * Community pulse — stats pulled from the DB + a small row of recent
 * member avatars. Gives new visitors a "there's people here" signal
 * even when the post count is low.
 */
export async function CommunityStats() {
  const admin = createAdminClient()

  const [
    { count: miembros },
    { count: dudas },
    { count: trabajos },
    { count: resueltas },
    { data: recentMembers },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'activa'),
    admin
      .from('posts_comunidad')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'duda'),
    admin
      .from('posts_comunidad')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'trabajo'),
    admin
      .from('posts_comunidad')
      .select('id', { count: 'exact', head: true })
      .eq('resuelto', true),
    admin
      .from('profiles')
      .select('nombre_completo, created_at')
      .eq('subscription_status', 'activa')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const stats: StatBox[] = [
    {
      label: 'Miembros',
      value: miembros || 0,
      icon: Users,
      color: 'text-primary-500',
    },
    {
      label: 'Dudas',
      value: dudas || 0,
      icon: MessageCircle,
      color: 'text-sky-500',
    },
    {
      label: 'Trabajos',
      value: trabajos || 0,
      icon: Briefcase,
      color: 'text-accent-500',
    },
    {
      label: 'Resueltas',
      value: resueltas || 0,
      icon: CheckCircle,
      color: 'text-success-500',
    },
  ]

  const members = recentMembers || []
  const hasMembers = members.length > 0
  const memberWord = (miembros || 0) === 1 ? 'miembro' : 'miembros'

  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 p-4">
      {/* Stats grid */}
      <div className="mb-3 grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/60 dark:bg-white/[0.02] px-2 py-2.5 text-center"
            >
              <Icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-lg font-bold leading-none text-neutral-900 dark:text-neutral-100">
                {stat.value}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {stat.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Recent members row */}
      {hasMembers && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m, i) => (
              <AvatarInicial
                key={i}
                nombre={m.nombre_completo}
                size="xs"
                ring
                className="border-2 border-white dark:border-neutral-900"
              />
            ))}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {miembros || 0}
            </span>{' '}
            {memberWord} de la comunidad
            {(miembros || 0) > 5 && ` · ${members.length} activos esta semana`}
          </p>
        </div>
      )}
    </div>
  )
}
