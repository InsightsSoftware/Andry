import { getUsers, getCurrentUserRole } from '@/actions/admin'
import { UserRoleToggle } from '@/components/admin/user-role-toggle'

export const metadata = { title: 'Admin - Usuarios' }

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    activa: {
      label: 'Activa',
      cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    expirada: {
      label: 'Expirada',
      cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    cancelada: {
      label: 'Cancelada',
      cls: 'bg-red-500/10 text-red-400 border border-red-500/20',
    },
    ninguna: {
      label: 'Sin plan',
      cls: 'bg-black/[0.03] dark:bg-white/5 text-neutral-500 border border-black/10 dark:border-white/10',
    },
  }
  const c = config[status] || config.ninguna
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  )
}

export default async function AdminUsersPage() {
  const [{ users }, { rol: callerRole, userId: callerId }] = await Promise.all([
    getUsers(),
    getCurrentUserRole(),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Gestión de Usuarios
        </h1>
        <p className="text-sm text-neutral-500">
          {users.length} usuarios
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Nombre
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Plan
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Estado
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Rol
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                Registro
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                  {user.nombre_completo || '—'}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 capitalize">
                  {user.subscription_plan || 'ninguno'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.subscription_status || 'ninguna'} />
                </td>
                <td className="px-4 py-3">
                  <UserRoleToggle
                    userId={user.id}
                    currentRole={user.rol}
                    callerRole={callerRole}
                    callerId={callerId ?? null}
                  />
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-neutral-500"
                >
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
