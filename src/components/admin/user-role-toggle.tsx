'use client'

import { useState } from 'react'
import { updateUserRole } from '@/actions/admin'
import { Shield, User, Crown, Users2, Loader2, ChevronDown } from 'lucide-react'


type Role = 'root' | 'admin' | 'estudiante' | 'comunidad'

interface UserRoleToggleProps {
  userId: string
  currentRole: string
  callerRole: string | null
  callerId: string | null
}

const ROLE_CONFIG: Record<Role, { icon: typeof Shield; label: string; cls: string; dotCls: string }> = {
  root: {
    icon: Crown,
    label: 'Root',
    cls: 'text-red-400',
    dotCls: 'bg-red-500',
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    cls: 'text-amber-400',
    dotCls: 'bg-amber-400',
  },
  estudiante: {
    icon: User,
    label: 'Estudiante',
    cls: 'text-neutral-400',
    dotCls: 'bg-neutral-400',
  },
  comunidad: {
    icon: Users2,
    label: 'CC',
    cls: 'text-violet-400',
    dotCls: 'bg-violet-400',
  },
}

export function UserRoleToggle({ userId, currentRole, callerRole, callerId }: UserRoleToggleProps) {
  const [role, setRole] = useState<Role>((currentRole as Role) || 'estudiante')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isRoot = callerRole === 'root'
  const isSelf = callerId === userId

  // Which roles this caller can assign
  const availableRoles: Role[] = isRoot
    ? ['root', 'admin', 'estudiante', 'comunidad']
    : ['admin', 'estudiante', 'comunidad']

  // Can this caller change this user's role?
  const canChange = !isSelf && (isRoot || (role !== 'root' && role !== 'admin'))

  async function handleChange(newRole: Role) {
    if (!canChange || newRole === role) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const result = await updateUserRole(userId, newRole)
      if ('success' in result && result.success) {
        setRole(newRole)
      } else if ('error' in result) {
        setErrorMsg(result.error ?? 'Error al cambiar rol')
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al cambiar rol')
    } finally {
      setLoading(false)
    }
  }

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.estudiante
  const Icon = config.icon

  return (
    <div className="flex flex-col items-start gap-1">
      {errorMsg && (
        <span className="text-[10px] text-red-400 leading-tight max-w-[160px]">{errorMsg}</span>
      )}

      {canChange ? (
        <div className="relative">
          <select
            value={role}
            onChange={(e) => handleChange(e.target.value as Role)}
            disabled={loading}
            className={`
              appearance-none cursor-pointer
              inline-flex items-center gap-1.5 rounded-full
              border border-white/10 bg-white/5
              pl-6 pr-6 py-1
              text-xs font-medium
              transition-colors hover:bg-white/10
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-1 focus:ring-white/20
              ${config.cls}
            `}
          >
            {availableRoles.map((r) => (
              <option key={r} value={r} className="bg-neutral-900 text-neutral-100">
                {ROLE_CONFIG[r].label}
              </option>
            ))}
          </select>

          {/* Icon overlay left */}
          <span className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 ${config.cls}`}>
            {loading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Icon className="h-3 w-3" />
            }
          </span>

          {/* Chevron right */}
          <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 ${config.cls} opacity-60`} />

          {/* Hide select text and show icon+label manually via padding trick —
              we can't overlay text easily, so we rely on select native text.
              Add enough left padding so the icon doesn't overlap the text. */}
          <style>{`
            select option { background-color: #171717; }
          `}</style>
        </div>
      ) : (
        /* Read-only badge when can't change */
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium ${config.cls}`}
          title={isSelf ? 'No puedes cambiar tu propio rol' : 'Sin permiso para modificar este rol'}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
      )}
    </div>
  )
}
