import Stripe from 'stripe'

// Server-side Stripe client — NEVER import in client components
// Lazy-initialized to avoid crashing at build time when env vars aren't set
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  }
  return _stripe
}

/**
 * Is the app running in simulated-payments mode?
 *
 * Returns true when:
 *  - ENABLE_SIMULATED_CHECKOUT=true is explicitly set (force simulation)
 *  - OR STRIPE_SECRET_KEY is empty / not a real key (defaults to simulation)
 *
 * Single source of truth — mirrored in /api/checkout and
 * /api/checkout/simulate. Safe to call from server only.
 */
export function isPaymentsSimulated(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || ''
  if (process.env.ENABLE_SIMULATED_CHECKOUT === 'true') return true
  return !key.startsWith('sk_')
}

export const PLANS = {
  basico: {
    name: 'Plan Básico',
    description: 'Acceso digital por 6 meses',
    priceId: process.env.STRIPE_PRICE_BASIC!,
    durationMonths: 6,
    features: [
      'Guía de estudio PDF interactiva',
      'Audiolibros por módulo',
      'Videos explicativos',
      'Banco de preguntas ilimitado',
      'Modo examen cronometrado',
      'Asistente IA 24/7',
      'Comunidad de estudio',
    ],
  },
  premium: {
    name: 'Plan Premium',
    description: 'Acceso completo por 12 meses + guía física',
    priceId: process.env.STRIPE_PRICE_PREMIUM!,
    durationMonths: 12,
    features: [
      'Todo lo del Plan Básico',
      'Acceso por 12 meses (en vez de 6)',
      'Guía de estudio física enviada a tu casa',
      'Comunidad VIP de trabajo',
      'Acceso a marketplace de contratistas',
      'Soporte prioritario',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
