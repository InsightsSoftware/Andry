import { CreditCard } from 'lucide-react'

export const metadata = { title: 'Admin - Pagos' }

export default function AdminPaymentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">
        Pagos y Suscripciones
      </h1>
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
        <CreditCard className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
        <p className="text-neutral-500">
          El historial de pagos se mostrará aquí cuando se conecte Stripe.
        </p>
      </div>
    </div>
  )
}
