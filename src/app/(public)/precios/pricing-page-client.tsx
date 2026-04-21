'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Star, AlertCircle, TestTube2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const plans = [
  {
    key: 'basico',
    name: 'Plan Básico',
    price: '$299',
    period: '6 meses',
    description: 'Acceso digital completo para preparar tu examen',
    features: [
      'Guía de estudio PDF interactiva (350+ páginas)',
      'Audiolibros por módulo',
      'Videos explicativos',
      'Banco de preguntas ilimitado',
      'Modo examen cronometrado',
      'Asistente IA 24/7',
      'Comunidad de estudio',
    ],
    popular: false,
  },
  {
    key: 'premium',
    name: 'Plan Premium',
    price: '$599',
    period: '12 meses',
    description: 'Todo incluido + guía física + comunidad VIP',
    features: [
      'Todo lo del Plan Básico',
      'Acceso por 12 meses (doble de tiempo)',
      'Guía de estudio física enviada a tu casa',
      'Comunidad VIP de trabajo',
      'Marketplace de contratistas',
      'Soporte prioritario',
    ],
    popular: true,
  },
]

interface PricingPageClientProps {
  simulated: boolean
}

export function PricingPageClient({ simulated }: PricingPageClientProps) {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleCheckout(planKey: string) {
    setError('')
    setLoadingPlan(planKey)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/registro?plan=${planKey}`)
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar pago')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al conectar con el sistema de pagos'
      )
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
            Elige tu plan de estudio
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Invierte en tu futuro. Un solo pago, sin sorpresas ni
            suscripciones mensuales.
          </p>
        </div>

        {/* Simulation mode banner */}
        {simulated && (
          <div className="mx-auto mb-8 flex max-w-2xl items-start gap-3 rounded-xl border border-warning-300 dark:border-warning-700 bg-warning-50 dark:bg-warning-900/20 px-4 py-3">
            <TestTube2 className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400 mt-0.5" />
            <div className="text-sm text-warning-700 dark:text-warning-400">
              <p className="font-semibold mb-0.5">Modo demostración</p>
              <p>
                Estamos en fase de pruebas. Podés suscribirte sin
                cargo real — no se procesa ningún pago. Cuando
                activemos los pagos reales, vas a poder comprar con
                tarjeta de crédito o débito.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto mb-8 flex max-w-md items-center gap-3 rounded-xl bg-danger-500/20 border border-danger-500/20 px-4 py-3 text-sm text-danger-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 pt-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 sm:p-8 glass-card ${
                plan.popular
                  ? 'border-primary-500/40 glow-purple'
                  : ''
              }`}
            >
              {plan.popular && (
                <>
                  {/* Gradient overlay wrapped so overflow-hidden doesn't
                      clip the "Más Popular" badge that sits above the card. */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary-600/30">
                      <Star className="h-3 w-3 fill-current" />
                      Más Popular
                    </span>
                  </div>
                </>
              )}
              <div className="relative">
                <h2 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {plan.name}
                </h2>
                <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                    / {plan.period}
                  </span>
                </div>
                <ul className="mb-8 flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success-500" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  fullWidth
                  variant={plan.popular ? 'primary' : 'outline'}
                  loading={loadingPlan === plan.key}
                  onClick={() => handleCheckout(plan.key)}
                >
                  {plan.popular ? plan.name : `Elegir ${plan.name}`}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            {simulated ? (
              <>
                Una vez activados los pagos reales, el cobro se hará por
                <strong> Stripe</strong> con garantía de 30 días.
              </>
            ) : (
              <>
                Pago seguro con tarjeta de crédito/débito a través de Stripe.
                <br />
                30 días de garantía — si no estás satisfecho, te devolvemos tu
                dinero.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
