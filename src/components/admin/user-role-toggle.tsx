'use client'

import { useState } from 'react'
import { updateUserRole, deleteUser } from '@/actions/admin'
import { Shield, User, Crown, Trash2 } from 'lucide-react'

interface UserRoleToggleProps {
  userId: string
  currentRole: string
  callerRole: string | null
  callerId: string | null
}

export function UserRoleToggle({ userId, currentRole, callerRole, callerId }: UserRoleToggleProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isRoot = callerRole === 'root'
  const isSelf = callerId === userId

  const handleToggle = async () => {
    if (role === 'root' || isSelf) return
    const newRole = role === 'admin' ? 'estudiante' : 'admin'
    setLoading(true)
    const result = await updateUserRole(userId, newRole as 'estudiante' | 'admin')
    if (result.success) {
      setRole(newRole)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setLoading(true)
    const result = await deleteUser(userId)
    if (result.success) {
      setDeleted(true)
    }
    setLoading(false)
    setConfirmDelete(false)
  }

  if (deleted) {
    return <span className="text-xs text-red-400">Eliminado</span>
  }

  const roleConfig: Record<string, { icon: typeof Shield; label: string; cls: string }> = {
    root: {
      icon: Crown,
      label: 'Root',
      cls: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    admin: {
      icon: Shield,
      label: 'Admin',
      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    estudiante: {
      icon: User,
      label: 'Estudiante',
      cls: 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/[0.08]',
    },
  }

  const config = roleConfig[role] || roleConfig.estudiante
  const Icon = config.icon
  const canToggle = !isSelf && role !== 'root' && (isRoot || role !== 'admin')

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading || !canToggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
          canToggle ? 'cursor-pointer' : 'cursor-default'
        } disabled:opacity-50 ${config.cls}`}
        title={
          role === 'root'
            ? 'Root — no se puede modificar'
            : isSelf
              ? 'No puedes cambiar tu propio rol'
              : `Click para cambiar a ${role === 'admin' ? 'estudiante' : 'admin'}`
        }
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </button>

      {isRoot && !isSelf && role !== 'root' && (
        confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
              className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-400 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-full p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
            title="Eliminar usuario"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )
      )}
    </div>
  )
}
