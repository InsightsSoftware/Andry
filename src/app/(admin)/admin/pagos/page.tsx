import { CreditCard } from 'lucide-react'
import { getPayments } from '@/actions/admin'

export const metadata = { title: 'Admin - Pagos' }

export default async function AdminPaymentsPage() {
  const { payments } = await getPayments()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Pagos y Suscripciones
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {payments.length} registros
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            No hay pagos registrados aún
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">
                  Plan
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">
                  Monto
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400">
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
                    className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {profile?.nombre_completo || '—'}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        {profile?.email || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-400">
                      {(pago.plan as string) || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      ${(((pago.monto_centavos as number) || 0) / 100).toFixed(2)}{' '}
                      <span className="text-xs font-normal text-neutral-400 uppercase">
                        {(pago.moneda as string) || 'usd'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          (pago.estado as string) === 'completado'
                            ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                            : (pago.estado as string) === 'pendiente'
                              ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {(pago.estado as string) || 'desconocido'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400 dark:text-neutral-500">
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
