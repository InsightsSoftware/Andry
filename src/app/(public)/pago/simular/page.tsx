'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function SimulatedCheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planKey = searchParams.get('plan') || 'basico'
  const userId = searchParams.get('uid') || ''

  const planName = planKey === 'premium' ? 'Plan Premium' : 'Plan Básico'
  const planPrice = planKey === 'premium' ? '$599.00' : '$299.00'
  const planPeriod = planKey === 'premium' ? '12 meses' : '6 meses'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar pago simulado')
      }

      router.push('/pago/exito')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al procesar pago'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Dev mode banner */}
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>Modo desarrollo</strong> — Este es un checkout simulado.
          En produccion se usa Stripe real.
        </p>
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
              Numero de tarjeta
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

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Vencimiento
              </label>
              <div className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-3">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">12/28</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                CVC
              </label>
              <div className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-3">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">123</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-danger-500/10 dark:bg-danger-500/20 px-4 py-2 text-sm text-danger-500">
              {error}
            </p>
          )}

          <Button
            size="lg"
            fullWidth
            loading={loading}
            onClick={handlePay}
          >
            <CheckCircle className="h-5 w-5" />
            Pagar {planPrice} (Simulado)
          </Button>

          <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Pago simulado — no se cobra nada real
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
