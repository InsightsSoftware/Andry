import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, type PlanKey } from '@/lib/stripe'

// Simulated checkout — only works when Stripe keys are placeholders
// In production, this route does nothing.
export async function POST(request: Request) {
  // Block in production
  const stripeKey = process.env.STRIPE_SECRET_KEY || ''
  if (!stripeKey.includes('placeholder')) {
    return NextResponse.json(
      { error: 'Simulated checkout disabled in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { planKey, userId } = body as {
      planKey: PlanKey
      userId: string
    }

    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json(
        { error: 'Plan inválido' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no especificado' },
        { status: 400 }
      )
    }

    const plan = PLANS[planKey]
    const adminSupabase = createAdminClient()

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths)

    // Activate subscription
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        subscription_status: 'activa',
        subscription_plan: planKey,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Simulate: profile update error:', updateError)
      return NextResponse.json(
        { error: 'Error al activar suscripción' },
        { status: 500 }
      )
    }

    // Record simulated payment
    const { error: paymentError } = await adminSupabase
      .from('pagos')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: `sim_${Date.now()}`,
        stripe_checkout_session_id: `sim_cs_${Date.now()}`,
        monto_centavos: planKey === 'premium' ? 49700 : 29700,
        moneda: 'usd',
        estado: 'completado',
        plan: planKey,
      })

    if (paymentError) {
      console.error('Simulate: payment record error:', paymentError)
      // Don't fail — subscription is already active
    }

    console.log(
      `✅ [SIMULATED] Subscription activated: user=${userId} plan=${planKey} expires=${expiresAt.toISOString()}`
    )

    return NextResponse.json({
      success: true,
      plan: planKey,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Simulate checkout error:', error)
    return NextResponse.json(
      { error: 'Error en checkout simulado' },
      { status: 500 }
    )
  }
}
