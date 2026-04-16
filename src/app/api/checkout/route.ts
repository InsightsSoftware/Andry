import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, PLANS, type PlanKey } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // 2. Parse and validate plan
    const body = await request.json()
    const planKey = body.planKey as PlanKey

    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json(
        { error: 'Plan inválido' },
        { status: 400 }
      )
    }

    const plan = PLANS[planKey]

    // DEV MODE: If Stripe keys are not real, redirect to simulated checkout
    const stripeKey = process.env.STRIPE_SECRET_KEY || ''
    const isDevMode =
      process.env.ENABLE_SIMULATED_CHECKOUT === 'true' ||
      !stripeKey.startsWith('sk_')
    if (isDevMode) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.json({
        url: `${appUrl}/pago/simular?plan=${planKey}`,
      })
    }

    // 3. Get or create Stripe customer
    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await adminSupabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 4. Create Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        plan_key: planKey,
        duration_months: String(plan.durationMonths),
      },
      success_url: `${appUrl}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/precios?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
