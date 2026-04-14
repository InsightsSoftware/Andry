import { Users } from 'lucide-react'

export const metadata = { title: 'Admin - Usuarios' }

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">
        Gestión de Usuarios
      </h1>
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
        <p className="text-neutral-500">
          La tabla de usuarios se mostrará aquí cuando se conecte Supabase.
        </p>
      </div>
    </div>
  )
}
