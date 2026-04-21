'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Archive,
  Download,
  RotateCcw,
  Trash2,
  Loader2,
  Info,
  X,
} from 'lucide-react'
import {
  getCsvBackupDownloadUrl,
  restoreCsvBackup,
  deleteCsvBackup,
} from '@/actions/admin'

interface Backup {
  id: string
  capitulo_id: string
  archivo_nombre: string
  cantidad_preguntas: number
  created_at: string
  capitulos: {
    nombre: string
    numero: number
    cursos: { nombre: string } | null
  } | null
}

export function CsvBackupsList({ initialBackups }: { initialBackups: Backup[] }) {
  const router = useRouter()
  const [backups, setBackups] = useState(initialBackups)
  const [pending, startTransition] = useTransition()
  const [confirmRestore, setConfirmRestore] = useState<Backup | null>(null)
  const [restoreMode, setRestoreMode] = useState<'add' | 'replace'>('add')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleDownload(id: string) {
    const result = await getCsvBackupDownloadUrl(id)
    if ('error' in result && result.error) {
      setMessage({ type: 'err', text: result.error })
      return
    }
    if ('url' in result && result.url) {
      window.open(result.url, '_blank')
    }
  }

  function openRestoreDialog(b: Backup) {
    setConfirmRestore(b)
    setRestoreMode('add')
  }

  function handleRestore() {
    if (!confirmRestore) return
    const target = confirmRestore
    const mode = restoreMode
    setConfirmRestore(null)

    startTransition(async () => {
      const result = await restoreCsvBackup(target.id, mode === 'replace')
      if ('error' in result && result.error) {
        setMessage({ type: 'err', text: result.error })
      } else if ('success' in result && result.success) {
        setMessage({
          type: 'ok',
          text: `${result.count} preguntas ${mode === 'replace' ? 'reemplazadas' : 'agregadas'} desde el backup.`,
        })
        router.refresh()
      }
    })
  }

  async function handleDelete(b: Backup) {
    if (!confirm(`¿Eliminar el backup "${b.archivo_nombre}"? No se podrá restaurar.`)) return
    startTransition(async () => {
      const result = await deleteCsvBackup(b.id)
      if ('error' in result && result.error) {
        setMessage({ type: 'err', text: result.error })
        return
      }
      setBackups((prev) => prev.filter((x) => x.id !== b.id))
    })
  }

  if (backups.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-8 text-center">
        <Archive className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Aún no hay backups
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Cada CSV que subas queda archivado acá automáticamente.
        </p>
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div
          className={`mb-3 flex items-center justify-between gap-2 rounded-xl border p-3 text-sm ${
            message.type === 'ok'
              ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
              : 'border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="shrink-0 p-1 opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Archivo</th>
              <th className="hidden px-4 py-3 text-left font-semibold md:table-cell">
                Capítulo
              </th>
              <th className="px-4 py-3 text-center font-semibold">Preguntas</th>
              <th className="hidden px-4 py-3 text-left font-semibold sm:table-cell">
                Fecha
              </th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {backups.map((b) => (
              <tr
                key={b.id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 shrink-0 text-neutral-400" />
                    <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                      {b.archivo_nombre}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 dark:text-neutral-400 md:table-cell">
                  {b.capitulos
                    ? `${b.capitulos.cursos?.nombre || ''} — Cap. ${b.capitulos.numero}: ${b.capitulos.nombre}`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {b.cantidad_preguntas}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 sm:table-cell">
                  {new Date(b.created_at).toLocaleString('es-AR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(b.id)}
                      disabled={pending}
                      className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 dark:hover:bg-neutral-800 dark:hover:text-primary-400 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Descargar CSV original"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openRestoreDialog(b)}
                      disabled={pending}
                      className="rounded-lg p-1.5 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Restaurar"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      disabled={pending}
                      className="rounded-lg p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/30 dark:hover:text-danger-400 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Eliminar backup"
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

      {/* Restore confirm dialog */}
      {confirmRestore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConfirmRestore(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 px-5 py-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Restaurar desde backup
              </h3>
              <button
                onClick={() => setConfirmRestore(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">
                Vas a restaurar <strong>{confirmRestore.archivo_nombre}</strong>{' '}
                con <strong>{confirmRestore.cantidad_preguntas} preguntas</strong>.
              </p>
              <p className="mb-4 flex items-start gap-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 p-3 text-xs text-primary-700 dark:text-primary-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Las preguntas actuales del capítulo no se modifican salvo
                  que elijas reemplazar todo.
                </span>
              </p>

              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 hover:border-primary-400 dark:hover:border-primary-600">
                  <input
                    type="radio"
                    name="mode"
                    checked={restoreMode === 'add'}
                    onChange={() => setRestoreMode('add')}
                    className="mt-1 accent-primary-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Agregar (recomendado)
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Las preguntas del backup se suman a las actuales. Puede
                      generar duplicados si las preguntas ya están.
                    </p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 hover:border-danger-400 dark:hover:border-danger-600">
                  <input
                    type="radio"
                    name="mode"
                    checked={restoreMode === 'replace'}
                    onChange={() => setRestoreMode('replace')}
                    className="mt-1 accent-danger-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Reemplazar todas
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Borra todas las preguntas actuales del capítulo y carga
                      solo las del backup. <strong>Esto no se puede deshacer.</strong>
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-700 px-5 py-3">
              <button
                onClick={() => setConfirmRestore(null)}
                className="rounded-xl px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                disabled={pending}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 ${
                  restoreMode === 'replace'
                    ? 'bg-danger-600 hover:bg-danger-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {restoreMode === 'replace' ? 'Reemplazar todo' : 'Agregar al capítulo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
