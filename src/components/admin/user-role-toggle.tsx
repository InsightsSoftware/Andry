'use client'

import { useState } from 'react'
import { updateUserRole } from '@/actions/admin'
import { Shield, User } from 'lucide-react'

interface UserRoleToggleProps {
  userId: string
  currentRole: string
}

export function UserRoleToggle({ userId, currentRole }: UserRoleToggleProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const newRole = role === 'admin' ? 'estudiante' : 'admin'
    setLoading(true)
    const result = await updateUserRole(userId, newRole as 'estudiante' | 'admin')
    if (result.success) {
      setRole(newRole)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 border ${
        role === 'admin'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/[0.08]'
      }`}
      title={`Click para cambiar a ${role === 'admin' ? 'estudiante' : 'admin'}`}
    >
      {role === 'admin' ? (
        <Shield className="h-3 w-3" />
      ) : (
        <User className="h-3 w-3" />
      )}
      {role === 'admin' ? 'Admin' : 'Estudiante'}
    </button>
  )
}
