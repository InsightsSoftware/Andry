import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, type PlanKey } from '@/lib/stripe'

// Simulated checkout — only works when Stripe keys are placeholders
// In production, this route does nothing.
export async function POST(request: Request) {
  // Block in production — only allow if explicitly enabled or Stripe key is a placeholder
  const stripeKey = process.env.STRIPE_SECRET_KEY || ''
  const isDevMode =
    process.env.ENABLE_SIMULATED_CHECKOUT === 'true' ||
    !stripeKey.startsWith('sk_')
  if (!isDevMode) {
    return NextResponse.json(
      { error: 'Simulated checkout disabled in production' },
      { status: 403 }
    )
  }

  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planKey } = body as { planKey: PlanKey }
    const userId = user.id

    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json(
        { error: 'Plan inválido' },
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
        monto_centavos: planKey === 'premium' ? 59900 : 29900,
        moneda: 'usd',
        estado: 'completado',
        plan: planKey,
      })

    if (paymentError) {
      console.error('Simulate: payment record error:', paymentError)
      // Don't fail — subscription is already active
    }

    // Log activation without leaking user ID
    console.log(`[SIMULATED] Subscription activated: plan=${planKey}`)

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
