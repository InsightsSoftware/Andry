import { getUsers, getCurrentUserRole } from '@/actions/admin'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

export const metadata = { title: 'Admin - Usuarios' }

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

      <AdminUsersClient
        initialUsers={users}
        callerRole={callerRole}
        callerId={callerId ?? null}
      />
    </div>
  )
}
