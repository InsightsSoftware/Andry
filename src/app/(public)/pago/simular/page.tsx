'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Lock, CheckCircle, TestTube2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function SimulatedCheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planKey = searchParams.get('plan') || 'basico'

  const planName = planKey === 'premium' ? 'Plan Premium' : 'Plan Básico'
  const planPrice = planKey === 'premium' ? '$599.00' : '$299.00'
  const planPeriod = planKey === 'premium' ? '12 meses' : '6 meses'

  function handlePay() {
    // In simulated mode just redirect to the success/register page.
    // Actual subscription activation happens AFTER the user creates their account.
    router.push(`/pago/exito?plan=${planKey}&simulated=true`)
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Simulation mode banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning-300 dark:border-warning-700 bg-warning-50 dark:bg-warning-900/20 px-4 py-3">
        <TestTube2 className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400 mt-0.5" />
        <div className="text-sm text-warning-700 dark:text-warning-400">
          <p className="font-semibold mb-0.5">Estás en modo demostración</p>
          <p>
            Hacé click abajo para continuar gratis mientras estamos en pruebas.
            No se cobra nada — los pagos reales se habilitan cuando se active Stripe.
          </p>
        </div>
      </div>

      {/* Simulated Stripe card */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Y Exam Prep</span>
            <Lock className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{planPrice}</span>
            <span className="text-sm text-neutral-400">/ {planPeriod}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">{planName}</p>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Número de tarjeta
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-3">
              <CreditCard className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                4242 4242 4242 4242
              </span>
              <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
                TEST
              </span>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Vencimiento
              </label>
              <div className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-3">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  12/28
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                CVC
              </label>
              <div className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-3">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  123
                </span>
              </div>
            </div>
          </div>

          <Button size="lg" fullWidth onClick={handlePay}>
            <CheckCircle className="h-5 w-5" />
            Confirmar {planName} (sin cargo)
          </Button>

          <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Modo demo — no se procesa ningún pago real.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SimulatedCheckoutPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Suspense>
        <SimulatedCheckoutForm />
      </Suspense>
    </div>
  )
}
