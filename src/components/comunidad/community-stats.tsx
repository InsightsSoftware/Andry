import { Users, MessageCircle, Briefcase } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AvatarInicial } from './avatar-inicial'

interface CurrentUser {
  nombre_completo: string
  avatar_url?: string | null
}

interface Props {
  currentUser?: CurrentUser | null
}

export async function CommunityStats({ currentUser }: Props = {}) {
  const admin = createAdminClient()

  const [
    { count: miembros },
    { count: dudasAbiertas },
    { count: dudasResueltas },
    { count: trabajosActivos },
    { count: trabajosCerrados },
    { data: recentMembers },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'activa'),
    admin
      .from('posts_comunidad')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'duda')
      .eq('resuelto', false),
    admin
      .from('posts_comunidad')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'duda')
      .eq('resuelto', true),
    admin
      .from('posts_comunidad')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'trabajo')
      .eq('resuelto', false),
    admin
      .from('posts_comunidad')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'trabajo')
      .eq('resuelto', true),
    admin
      .from('profiles')
      .select('nombre_completo, avatar_url, created_at')
      .eq('subscription_status', 'activa')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const members = recentMembers || []
  const hasMembers = members.length > 0 || !!currentUser
  const memberWord = (miembros || 0) === 1 ? 'miembro' : 'miembros'

  // Build avatar list: current user first, then up to 4 others (excluding current user by name)
  const otherMembers = currentUser
    ? members.filter((m) => m.nombre_completo !== currentUser.nombre_completo).slice(0, 4)
    : members.slice(0, 5)
  const avatarList: { nombre_completo: string; avatar_url?: string | null }[] = currentUser
    ? [currentUser, ...otherMembers]
    : otherMembers

  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 p-4">
      {/* Stats grid */}
      <div className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
        {/* Miembros */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-white/60 dark:bg-white/[0.02] px-2 py-2.5 text-center">
          <Users className="h-4 w-4 text-primary-500" />
          <span className="text-lg font-bold leading-none text-neutral-900 dark:text-neutral-100">
            {miembros || 0}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Miembros
          </span>
        </div>

        {/* Dudas */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-white/60 dark:bg-white/[0.02] px-2 py-2.5 text-center">
          <MessageCircle className="h-4 w-4 text-sky-500" />
          <span className="text-lg font-bold leading-none text-neutral-900 dark:text-neutral-100">
            {dudasAbiertas || 0}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Sin resolver
          </span>
          <span className="text-[9px] text-success-600 dark:text-success-400 font-medium leading-none">
            {dudasResueltas || 0} resueltas
          </span>
        </div>

        {/* Trabajos */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-white/60 dark:bg-white/[0.02] px-2 py-2.5 text-center">
          <Briefcase className="h-4 w-4 text-accent-500" />
          <span className="text-lg font-bold leading-none text-neutral-900 dark:text-neutral-100">
            {trabajosActivos || 0}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Activos
          </span>
          <span className="text-[9px] text-success-600 dark:text-success-400 font-medium leading-none">
            {trabajosCerrados || 0} resueltos
          </span>
        </div>
      </div>

      {/* Avatar row: current user first, then others */}
      {hasMembers && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {avatarList.slice(0, 5).map((m, i) => (
              <AvatarInicial
                key={i}
                nombre={m.nombre_completo}
                avatarUrl={m.avatar_url}
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
            {memberWord}
          </p>
        </div>
      )}
    </div>
  )
}
