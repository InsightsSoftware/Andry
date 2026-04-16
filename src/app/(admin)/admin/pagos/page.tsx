import { CreditCard } from 'lucide-react'
import { getPayments } from '@/actions/admin'

export const metadata = { title: 'Admin - Pagos' }

export default async function AdminPaymentsPage() {
  const { payments } = await getPayments()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Pagos y Suscripciones
        </h1>
        <p className="text-sm text-neutral-500">
          {payments.length} registros
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-12 text-center">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
          <p className="text-neutral-500">
            No hay pagos registrados aún
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl glass-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                  Plan
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                  Monto
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pago: Record<string, unknown>) => {
                const profile = pago.profiles as {
                  nombre_completo: string
                  email: string
                } | null
                return (
                  <tr
                    key={pago.id as string}
                    className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {profile?.nombre_completo || '—'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {profile?.email || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-700 dark:text-neutral-300">
                      {(pago.plan as string) || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                      ${(((pago.monto_centavos as number) || 0) / 100).toFixed(2)}{' '}
                      <span className="text-xs font-normal text-neutral-500 uppercase">
                        {(pago.moneda as string) || 'usd'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          (pago.estado as string) === 'completado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : (pago.estado as string) === 'pendiente'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-black/[0.03] dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border border-black/10 dark:border-white/10'
                        }`}
                      >
                        {(pago.estado as string) || 'desconocido'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Date(pago.created_at as string).toLocaleDateString(
                        'es-ES',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
