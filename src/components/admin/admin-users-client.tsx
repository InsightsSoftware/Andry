'use client'

import { useState, useMemo } from 'react'
import { updateEnvioEstado, inviteUser, updateUserLicencia } from '@/actions/admin'
import { UserRoleToggle } from './user-role-toggle'
import {
  ChevronDown,
  ChevronUp,
  Package,
  PackageCheck,
  PackageX,
  MapPin,
  Phone,
  Filter,
  UserPlus,
  X,
  Loader2,
  BadgeCheck,
  Pencil,
  Check,
} from 'lucide-react'

type User = {
  id: string
  email: string
  nombre_completo: string | null
  rol: string
  subscription_status: string | null
  subscription_plan: string | null
  subscription_expires_at: string | null
  created_at: string
  telefono?: string | null
  direccion?: string | null
  envio_estado?: string | null
  oficio?: string | null
  numero_licencia?: string | null
}

type EnvioTab = 'todos' | 'pendiente' | 'enviado'

const ENVIO_CONFIG: Record<string, { label: string; icon: typeof Package; cls: string }> = {
  pendiente: {
    label: 'Pendiente',
    icon: Package,
    cls: 'bg-amber-500/10 text-amber-500 border-amber-500/30 dark:text-amber-400',
  },
  enviado: {
    label: 'Enviado',
    icon: PackageCheck,
    cls: 'bg-success-500/10 text-success-600 border-success-500/30 dark:text-success-400',
  },
  no_aplica: {
    label: 'N/A',
    icon: PackageX,
    cls: 'bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700',
  },
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    activa:    { label: 'Activa',    cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    expirada:  { label: 'Expirada',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    cancelada: { label: 'Cancelada', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' },
    ninguna:   { label: 'Sin plan',  cls: 'bg-black/[0.03] dark:bg-white/5 text-neutral-500 border border-black/10 dark:border-white/10' },
  }
  const c = config[status] || config.ninguna
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  )
}

function EnvioButton({ userId, estado }: { userId: string; estado: string }) {
  const [current, setCurrent] = useState(estado || 'no_aplica')
  const [loading, setLoading] = useState(false)

  const cycle: Record<string, 'pendiente' | 'enviado' | 'no_aplica'> = {
    no_aplica: 'pendiente',
    pendiente: 'enviado',
    enviado:   'pendiente',
  }

  async function handleClick() {
    const next = cycle[current] ?? 'pendiente'
    setLoading(true)
    const result = await updateEnvioEstado(userId, next)
    if (result.success) setCurrent(next)
    setLoading(false)
  }

  const cfg = ENVIO_CONFIG[current] || ENVIO_CONFIG.no_aplica
  const Icon = cfg.icon

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Click para cambiar estado de envío"
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 hover:scale-105 ${cfg.cls}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </button>
  )
}

function UserRow({
  user,
  callerRole,
  callerId,
}: {
  user: User
  callerRole: string | null
  callerId: string | null
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              : <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            }
            <span className="font-medium text-neutral-900 dark:text-white">
              {user.nombre_completo || '—'}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-sm">
          {user.email}
        </td>
        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 capitalize text-sm">
          {user.subscription_plan || 'ninguno'}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={user.subscription_status || 'ninguna'} />
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <EnvioButton userId={user.id} estado={user.envio_estado || 'no_aplica'} />
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <UserRoleToggle
            userId={user.id}
            currentRole={user.rol}
            callerRole={callerRole}
            callerId={callerId}
          />
        </td>
        <td className="px-4 py-3 text-neutral-500 text-xs">
          {new Date(user.created_at).toLocaleDateString('es-ES')}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="border-b border-black/5 dark:border-white/5 bg-neutral-50/60 dark:bg-neutral-800/30">
          <td colSpan={7} className="px-8 py-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              {/* Contact */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Contacto
                </p>
                {user.telefono ? (
                  <a
                    href={`tel:${user.telefono}`}
                    className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="h-3.5 w-3.5 text-neutral-400" />
                    {user.telefono}
                  </a>
                ) : (
                  <p className="text-neutral-400 italic">Sin teléfono</p>
                )}
              </div>

              {/* Address */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Dirección de envío
                </p>
                {user.direccion ? (
                  <p className="flex items-start gap-1.5 text-neutral-700 dark:text-neutral-300">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    {user.direccion}
                  </p>
                ) : (
                  <p className="text-neutral-400 italic">Sin dirección registrada</p>
                )}
              </div>

              {/* License number — inline editable */}
              <LicenciaEditor user={user} />

              {/* Subscription details */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Suscripción
                </p>
                <div className="space-y-0.5">
                  <p className="text-neutral-700 dark:text-neutral-300 capitalize">
                    {user.subscription_plan || 'Sin plan'}
                  </p>
                  {user.subscription_expires_at && (
                    <p className="text-xs text-neutral-500">
                      Vence: {new Date(user.subscription_expires_at).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

interface Props {
  initialUsers: User[]
  callerRole: string | null
  callerId: string | null
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<'comunidad' | 'estudiante'>('comunidad')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; msg: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const r = await inviteUser(email.trim(), rol)
    if (r.success) {
      setResult({ ok: true, msg: `Invitación enviada a ${email}` })
    } else {
      setResult({ ok: false, msg: r.error || 'Error al invitar' })
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl glass-card p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Invitar usuario
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className={`rounded-xl p-3 text-sm ${result.ok ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300' : 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300'}`}>
            {result.msg}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@email.com"
                className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Rol
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as 'comunidad' | 'estudiante')}
                className="mt-1 w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:outline-none"
              >
                <option value="comunidad">CC — Contratista Certificado (solo comunidad)</option>
                <option value="estudiante">Estudiante (acceso completo)</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? 'Enviando...' : 'Enviar invitación'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function LicenciaEditor({ user }: { user: User }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(user.numero_licencia ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateUserLicencia(user.id, value)
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Licencia
      </p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            placeholder="Ej: CGC1234567"
            className="flex-1 rounded-lg border border-primary-500 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-500 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group/lic">
          {user.numero_licencia || saved ? (
            <span className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              <BadgeCheck className="h-4 w-4 text-success-500 shrink-0" />
              {value || user.numero_licencia}
            </span>
          ) : (
            <span className="text-sm text-neutral-400 italic">Sin licencia registrada</span>
          )}
          <button
            onClick={() => setEditing(true)}
            title="Editar número de licencia"
            className="opacity-0 group-hover/lic:opacity-100 flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function AdminUsersClient({ initialUsers, callerRole, callerId }: Props) {
  const [tab, setTab] = useState<EnvioTab>('todos')
  const [search, setSearch] = useState('')
  const [oficioFilter, setOficioFilter] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  const pending = useMemo(
    () => initialUsers.filter((u) => u.envio_estado === 'pendiente'),
    [initialUsers]
  )
  const sent = useMemo(
    () => initialUsers.filter((u) => u.envio_estado === 'enviado'),
    [initialUsers]
  )

  // Unique oficio values for the filter dropdown
  const oficios = useMemo(() => {
    const set = new Set<string>()
    initialUsers.forEach((u) => { if (u.oficio?.trim()) set.add(u.oficio.trim()) })
    return Array.from(set).sort()
  }, [initialUsers])

  const filtered = useMemo(() => {
    let list = initialUsers
    if (tab === 'pendiente') list = pending
    if (tab === 'enviado')   list = sent
    if (oficioFilter) {
      list = list.filter((u) => u.oficio?.trim() === oficioFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.nombre_completo || '').toLowerCase().includes(q) ||
          (u.direccion || '').toLowerCase().includes(q) ||
          (u.oficio || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [initialUsers, tab, pending, sent, search, oficioFilter])

  return (
    <div>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Tab pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-neutral-400" />
          {([
            { key: 'todos',     label: `Todos (${initialUsers.length})` },
            { key: 'pendiente', label: `Pendientes de envío (${pending.length})` },
            { key: 'enviado',   label: `Enviados (${sent.length})` },
          ] as { key: EnvioTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                tab === key
                  ? key === 'pendiente'
                    ? 'bg-amber-500 text-white'
                    : key === 'enviado'
                      ? 'bg-success-500 text-white'
                      : 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + Oficio filter + Invite */}
        <div className="ml-auto flex items-center gap-2">
          {/* Oficio filter */}
          {oficios.length > 0 && (
            <select
              value={oficioFilter}
              onChange={(e) => setOficioFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
            >
              <option value="">Todos los oficios</option>
              {oficios.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          )}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, dirección..."
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-56"
          />
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invitar
          </button>
        </div>
      </div>

      {/* Table */}
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
                Envío
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
            {filtered.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                callerRole={callerRole}
                callerId={callerId}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                  {search ? 'Sin resultados para esa búsqueda' : 'No hay usuarios en esta categoría'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
