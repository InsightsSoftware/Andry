import { createClient } from '@/lib/supabase/server'
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ManageSubscriptionButton } from '@/components/ui/manage-subscription-button'
import { SignOutButton } from '@/components/ui/sign-out-button'
import { ReplayTourButton } from '@/components/tour/replay-tour-button'

export const metadata = { title: 'Mi Perfil' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (!profile) return null

  const planLabel =
    profile.subscription_plan === 'premium'
      ? 'Plan Premium'
      : profile.subscription_plan === 'basico'
        ? 'Plan Básico'
        : 'Sin plan'

  const statusLabel =
    profile.subscription_status === 'activa'
      ? 'Activa'
      : profile.subscription_status === 'expirada'
        ? 'Expirada'
        : 'Inactiva'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Mi Perfil</h1>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-800/30">
            <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {profile.nombre_completo || 'Sin nombre'}
            </h2>
            <span
              className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                profile.subscription_status === 'activa'
                  ? 'bg-success-500/10 dark:bg-success-500/20 text-success-600 dark:text-success-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {planLabel} - {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{profile.email}</span>
          </div>
          {profile.telefono && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {profile.telefono}
              </span>
            </div>
          )}
          {profile.direccion && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {profile.direccion}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Miembro desde {formatDate(profile.created_at)}
            </span>
          </div>
          {profile.subscription_expires_at && (
            <div className="mt-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Tu suscripción{' '}
                {profile.subscription_status === 'activa' ? 'vence' : 'venció'}{' '}
                el{' '}
                <strong>
                  {formatDate(profile.subscription_expires_at)}
                </strong>
              </p>
            </div>
          )}

          {profile.stripe_customer_id && (
            <div className="mt-4">
              <ManageSubscriptionButton />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <ReplayTourButton />
        <SignOutButton />
      </div>
    </div>
  )
}
