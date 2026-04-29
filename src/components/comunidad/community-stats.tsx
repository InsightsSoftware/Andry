import { Users, MessageCircle, Briefcase, CheckCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AvatarInicial } from './avatar-inicial'

/**
 * Community pulse — dynamic stats that reflect active/open items only.
 *
 * Dudas: shows open (unresolved) count as the main metric, resolved count
 * as sub-label. Trabajos: shows active (non-closed) count, closed count
 * as sub-label. Miembros: total active subscribers (static rising counter).
 */
export async function CommunityStats() {
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
      .select('nombre_completo, created_at')
      .eq('subscription_status', 'activa')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const members = recentMembers || []
  const hasMembers = members.length > 0
  const memberWord = (miembros || 0) === 1 ? 'miembro' : 'miembros'

  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 p-4">
      {/* Stats grid */}
      <div className="mb-3 grid grid-cols-4 gap-2 sm:gap-3">
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

        {/* Dudas abiertas */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-white/60 dark:bg-white/[0.02] px-2 py-2.5 text-center">
          <MessageCircle className="h-4 w-4 text-sky-500" />
          <span className="text-lg font-bold leading-none text-neutral-900 dark:text-neutral-100">
            {dudasAbiertas || 0}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Dudas
          </span>
          {(dudasResueltas || 0) > 0 && (
            <span className="text-[9px] text-success-600 dark:text-success-400 font-medium leading-none">
              {dudasResueltas} resueltas
            </span>
          )}
        </div>

        {/* Trabajos activos */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-white/60 dark:bg-white/[0.02] px-2 py-2.5 text-center">
          <Briefcase className="h-4 w-4 text-accent-500" />
          <span className="text-lg font-bold leading-none text-neutral-900 dark:text-neutral-100">
            {trabajosActivos || 0}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Trabajos
          </span>
          {(trabajosCerrados || 0) > 0 && (
            <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium leading-none">
              {trabajosCerrados} cerrados
            </span>
          )}
        </div>

        {/* Resueltas total */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-white/60 dark:bg-white/[0.02] px-2 py-2.5 text-center">
          <CheckCircle className="h-4 w-4 text-success-500" />
          <span className="text-lg font-bold leading-none text-neutral-900 dark:text-neutral-100">
            {(dudasResueltas || 0) + (trabajosCerrados || 0)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Cerradas
          </span>
        </div>
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
