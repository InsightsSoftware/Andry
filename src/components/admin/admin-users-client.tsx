'use client'

import { useState, useMemo } from 'react'
import { updateEnvioEstado, inviteUser, deleteUser, setPermanentAccess } from '@/actions/admin'
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
  Trash2,
  AlertTriangle,
  Infinity as InfinityIcon,
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

type Sub = { status: string | null; plan: string | null; expires: string | null }

function PermanentAccessControl({
  userId,
  sub,
  onChange,
}: {
  userId: string
  sub: Sub
  onChange: (s: Sub) => void
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const isPermanent = sub.status === 'activa' && sub.expires === null

  async function toggle(permanent: boolean) {
    setLoading(true)
    setErr(null)
    const r = await setPermanentAccess(userId, permanent)
    if ('success' in r && r.success) {
      onChange({ status: r.status, plan: r.plan, expires: r.expires_at })
    } else {
      setErr(('error' in r && r.error) || 'Error')
    }
    setLoading(false)
  }

  return (
    <div className="mt-2">
      {isPermanent ? (
        <button
          onClick={() => toggle(false)}
          disabled={loading}
          title="Vuelve a poner vencimiento (revoca el acceso permanente)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-danger-300 dark:border-danger-700 px-2.5 py-1 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          Desactivar acceso permanente
        </button>
      ) : (
        <button
          onClick={() => toggle(true)}
          disabled={loading}
          title="El usuario queda con acceso premium que nunca vence"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <InfinityIcon className="h-3 w-3" />}
          Hacer que nunca venza
        </button>
      )}
      {err && <p className="mt-1 text-xs text-danger-500">{err}</p>}
    </div>
  )
}

function UserRow({
  user,
  callerRole,
  callerId,
  onDelete,
}: {
  user: User
  callerRole: string | null
  callerId: string | null
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [sub, setSub] = useState<Sub>({
    status: user.subscription_status,
    plan: user.subscription_plan,
    expires: user.subscription_expires_at,
  })

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteUser(user.id)
    if (result.success) {
      onDelete(user.id)
    } else {
      setDeleteError(result.error || 'Error al eliminar')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

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
          {sub.plan || 'ninguno'}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={sub.status || 'ninguna'} />
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

              {/* Oficio */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Oficio
                </p>
                {user.oficio ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400 capitalize">
                    {user.oficio}
                  </span>
                ) : (
                  <p className="text-neutral-400 italic">Sin oficio registrado</p>
                )}
              </div>

              {/* Subscription details */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Suscripción
                </p>
                <div className="space-y-0.5">
                  <p className="text-neutral-700 dark:text-neutral-300 capitalize">
                    {sub.plan || 'Sin plan'}
                  </p>
                  {sub.status === 'activa' && sub.expires === null ? (
                    <p className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <InfinityIcon className="h-3 w-3" /> Nunca vence
                    </p>
                  ) : sub.expires ? (
                    <p className="text-xs text-neutral-500">
                      Vence: {new Date(sub.expires).toLocaleDateString('es-ES')}
                    </p>
                  ) : null}
                  <PermanentAccessControl
                    userId={user.id}
                    sub={sub}
                    onChange={setSub}
                  />
                </div>
              </div>
            </div>

            {/* Delete zone — only if not self */}
            {callerId !== user.id && (
              <div className="mt-4 flex items-center gap-3 border-t border-black/5 dark:border-white/5 pt-4">
                {deleteError && (
                  <span className="flex items-center gap-1.5 text-xs text-danger-600 dark:text-danger-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {deleteError}
                  </span>
                )}
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      ¿Eliminar a <strong>{user.nombre_completo || user.email}</strong>? Esta acción no se puede deshacer.
                    </span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-500 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-danger-300 dark:border-danger-700 px-3 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar usuario
                  </button>
                )}
              </div>
            )}
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

export function AdminUsersClient({ initialUsers, callerRole, callerId }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [tab, setTab] = useState<EnvioTab>('todos')
  const [search, setSearch] = useState('')
  const [oficioFilter, setOficioFilter] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  function handleDelete(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const pending = useMemo(
    () => users.filter((u) => u.envio_estado === 'pendiente'),
    [users]
  )
  const sent = useMemo(
    () => users.filter((u) => u.envio_estado === 'enviado'),
    [users]
  )

  // Unique oficio values for the filter dropdown
  const oficios = useMemo(() => {
    const set = new Set<string>()
    users.forEach((u) => { if (u.oficio?.trim()) set.add(u.oficio.trim()) })
    return Array.from(set).sort()
  }, [users])

  const filtered = useMemo(() => {
    let list = users
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
  }, [users, tab, pending, sent, search, oficioFilter])

  return (
    <div>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Tab pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-neutral-400" />
          {([
            { key: 'todos',     label: `Todos (${users.length})` },
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
                onDelete={handleDelete}
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
