import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, PLANS, isPaymentsSimulated, type PlanKey } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const planKey = body.planKey as PlanKey

    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const plan = PLANS[planKey]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Simulation mode — no real Stripe configured
    if (isPaymentsSimulated()) {
      return NextResponse.json({
        url: `/pago/simular?plan=${planKey}`,
      })
    }

    // Real Stripe — create checkout WITHOUT requiring an existing user account.
    // The user creates their Supabase account AFTER payment on the success page.
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      customer_creation: 'always',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      metadata: {
        plan_key: planKey,
        duration_months: String(plan.durationMonths),
        // NOTE: supabase_user_id is intentionally absent —
        // the user will be created on the /pago/exito success page.
      },
      success_url: `${appUrl}/pago/exito?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
      cancel_url: `${appUrl}/precios?cancelled=true`,
    }

    // El Plan Premium incluye la guía física → Stripe recolecta la dirección de
    // envío estructurada y validada en el checkout (luego va a GHL vía el
    // workflow de Stripe). El Plan Básico es 100% digital: no se le pide dirección.
    if (planKey === 'premium') {
      params.shipping_address_collection = { allowed_countries: ['US'] }
    }

    const session = await getStripe().checkout.sessions.create(params)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
