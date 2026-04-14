import Link from 'next/link'
import { CheckCircle, ArrowRight, Star } from 'lucide-react'

const plans = [
  {
    key: 'basico',
    name: 'Plan Básico',
    price: '$297',
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
    cta: 'Elegir Plan Básico',
    popular: false,
  },
  {
    key: 'premium',
    name: 'Plan Premium',
    price: '$497',
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
    cta: 'Elegir Plan Premium',
    popular: true,
  },
]

export default function PricingPage() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-neutral-900 sm:text-4xl">
            Elige tu plan de estudio
          </h1>
          <p className="text-lg text-neutral-600">
            Invierte en tu futuro. Un solo pago, sin sorpresas ni suscripciones mensuales.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 bg-white p-6 sm:p-8 ${
                plan.popular
                  ? 'border-primary-500 shadow-lg'
                  : 'border-neutral-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-4 py-1 text-xs font-bold text-white">
                    <Star className="h-3 w-3" />
                    Más Popular
                  </span>
                </div>
              )}
              <h2 className="mb-1 text-xl font-bold text-neutral-900">
                {plan.name}
              </h2>
              <p className="mb-4 text-sm text-neutral-500">
                {plan.description}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-neutral-900">
                  {plan.price}
                </span>
                <span className="ml-2 text-neutral-500">/ {plan.period}</span>
              </div>
              <ul className="mb-8 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success-500" />
                    <span className="text-sm text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/registro?plan=${plan.key}`}
                className={`flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl text-lg font-bold transition-colors ${
                  plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            Pago seguro con tarjeta de crédito/débito a través de Stripe.
            <br />
            30 días de garantía — si no estás satisfecho, te devolvemos tu dinero.
          </p>
        </div>
      </div>
    </div>
  )
}
