import { Users } from 'lucide-react'

export const metadata = { title: 'Admin - Usuarios' }

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Gestión de Usuarios
      </h1>
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
        <p className="text-neutral-500 dark:text-neutral-400">
          La tabla de usuarios se mostrará aquí cuando se conecte Supabase.
        </p>
      </div>
    </div>
  )
}
