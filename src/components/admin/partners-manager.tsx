'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  ExternalLink,
  Video as VideoIcon,
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react'
import {
  createPartner,
  updatePartner,
  deletePartner,
  togglePartnerActive,
  type PartnerInput,
} from '@/actions/partners'
import { CATEGORIA_LABELS } from '@/lib/partners'
import type { Partner, PartnerCategoria } from '@/types/database'

interface PartnersManagerProps {
  initialPartners: Partner[]
}

const EMPTY_FORM: PartnerInput = {
  nombre: '',
  slug: '',
  descripcion: '',
  categoria: 'creditos',
  logo_url: '',
  video_url: '',
  sitio_web: '',
  cta_text: 'Contactar',
  orden: 0,
  destacado: false,
  activo: true,
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function PartnersManager({ initialPartners }: PartnersManagerProps) {
  const router = useRouter()
  const [partners, setPartners] = useState(initialPartners)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<PartnerInput>(EMPTY_FORM)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  function openEdit(p: Partner) {
    setEditing(p)
    setForm({
      nombre: p.nombre,
      slug: p.slug,
      descripcion: p.descripcion,
      categoria: p.categoria,
      logo_url: p.logo_url || '',
      video_url: p.video_url,
      sitio_web: p.sitio_web || '',
      cta_text: p.cta_text,
      orden: p.orden,
      destacado: p.destacado,
      activo: p.activo,
    })
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      ...form,
      slug: form.slug || slugify(form.nombre),
    }

    startTransition(async () => {
      const result = editing
        ? await updatePartner(editing.id, payload)
        : await createPartner(payload)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        closeForm()
        router.refresh()
      }
    })
  }

  async function handleDelete(p: Partner) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esto no se puede deshacer.`)) return
    startTransition(async () => {
      const result = await deletePartner(p.id)
      if ('error' in result && result.error) {
        alert(result.error)
        return
      }
      setPartners((prev) => prev.filter((x) => x.id !== p.id))
      router.refresh()
    })
  }

  async function handleToggle(p: Partner) {
    startTransition(async () => {
      const result = await togglePartnerActive(p.id, !p.activo)
      if ('error' in result && result.error) {
        alert(result.error)
        return
      }
      setPartners((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, activo: !x.activo } : x))
      )
      router.refresh()
    })
  }

  return (
    <div>
      {/* Top action bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {partners.length} partner{partners.length === 1 ? '' : 's'} en total
        </p>
        <button
          onClick={openCreate}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-accent-400 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Nuevo aliado
        </button>
      </div>

      {/* Partners list */}
      {partners.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-4 text-neutral-500 dark:text-neutral-400">
            Aún no hay aliados. Sumá el primero.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-accent-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar aliado
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Aliado</th>
                <th className="hidden px-4 py-3 text-left font-semibold sm:table-cell">
                  Categoría
                </th>
                <th className="hidden px-4 py-3 text-center font-semibold md:table-cell">
                  Orden
                </th>
                <th className="px-4 py-3 text-center font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {partners.map((p) => (
                <tr
                  key={p.id}
                  className={`${p.activo ? '' : 'opacity-50'} hover:bg-neutral-50 dark:hover:bg-neutral-800/50`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logo_url}
                          alt={p.nombre}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                          <VideoIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                            {p.nombre}
                          </span>
                          {p.destacado && (
                            <Star className="h-3.5 w-3.5 shrink-0 fill-accent-500 text-accent-500" />
                          )}
                        </div>
                        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          /{p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-600 dark:text-neutral-400 sm:table-cell">
                    {CATEGORIA_LABELS[p.categoria]}
                  </td>
                  <td className="hidden px-4 py-3 text-center text-neutral-600 dark:text-neutral-400 md:table-cell">
                    {p.orden}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(p)}
                      disabled={pending}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                        p.activo
                          ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {p.activo ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Activo
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Oculto
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        disabled={pending}
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors disabled:opacity-50 cursor-pointer"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={pending}
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/30 dark:hover:text-danger-400 transition-colors disabled:opacity-50 cursor-pointer"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeForm}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {editing ? `Editar ${editing.nombre}` : 'Nuevo aliado'}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {/* Nombre + Slug */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" required>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => {
                      const nombre = e.target.value
                      setForm((f) => ({
                        ...f,
                        nombre,
                        slug: editing ? f.slug : slugify(nombre),
                      }))
                    }}
                    required
                    placeholder="Ej: Insights Software"
                    className={inputCls}
                  />
                </Field>
                <Field label="Slug (URL)" required>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                    }
                    required
                    placeholder="insights-software"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Categoría */}
              <Field label="Categoría" required>
                <select
                  value={form.categoria}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      categoria: e.target.value as PartnerCategoria,
                    }))
                  }
                  className={inputCls}
                >
                  {(Object.keys(CATEGORIA_LABELS) as PartnerCategoria[]).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORIA_LABELS[cat]}
                      </option>
                    )
                  )}
                </select>
              </Field>

              {/* Descripción */}
              <Field
                label="Descripción"
                required
                help="10-500 caracteres. Qué ofrece el aliado."
              >
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descripcion: e.target.value }))
                  }
                  required
                  rows={3}
                  placeholder="Automatización de negocios y software a medida para contratistas en Florida..."
                  className={inputCls}
                />
              </Field>

              {/* Video URL */}
              <Field
                label="URL del video"
                required
                help="Path en Storage o URL completa (YouTube, MP4)"
              >
                <input
                  type="text"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, video_url: e.target.value }))
                  }
                  required
                  placeholder="partners/insights-demo.mp4"
                  className={inputCls}
                />
              </Field>

              {/* Logo URL + Sitio web */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="URL del logo" help="Opcional">
                  <input
                    type="url"
                    value={form.logo_url || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, logo_url: e.target.value }))
                    }
                    placeholder="https://..."
                    className={inputCls}
                  />
                </Field>
                <Field label="Sitio web" help="Opcional">
                  <input
                    type="url"
                    value={form.sitio_web || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sitio_web: e.target.value }))
                    }
                    placeholder="https://insights-software.com"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* CTA + Orden */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Texto del botón (CTA)" required>
                  <input
                    type="text"
                    value={form.cta_text}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cta_text: e.target.value }))
                    }
                    required
                    placeholder="Agendar demo"
                    className={inputCls}
                  />
                </Field>
                <Field label="Orden" help="Menor = primero">
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        orden: parseInt(e.target.value) || 0,
                      }))
                    }
                    min={0}
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/30 p-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.destacado}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, destacado: e.target.checked }))
                    }
                    className="h-4 w-4 rounded accent-accent-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    <Star className="mr-1 inline h-3.5 w-3.5 text-accent-500" />
                    Destacado (aparece primero)
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, activo: e.target.checked }))
                    }
                    className="h-4 w-4 rounded accent-success-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Activo (visible para usuarios)
                  </span>
                </label>
              </div>

              {error && (
                <p className="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-3 text-sm text-danger-600 dark:text-danger-400">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={pending}
                  className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-accent-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear aliado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Form field helpers ─────────────────────────────────────────────

function Field({
  label,
  children,
  required,
  help,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  help?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        {label}
        {required && <span className="text-danger-500">*</span>}
      </span>
      {children}
      {help && (
        <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
          {help}
        </p>
      )}
    </label>
  )
}

const inputCls =
  'block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20'

// Helper unused export to silence ExternalLink import
export { ExternalLink as _E }
