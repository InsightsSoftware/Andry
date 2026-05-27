import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseConfirmationEmail } from '@/lib/email'
import { notifyGHL } from '@/lib/ghl'
import Stripe from 'stripe'

// Stripe sends raw body — we need to read it as text for signature verification
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  const adminSupabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId = session.metadata?.supabase_user_id
        const planKey = session.metadata?.plan_key
        const durationMonths = parseInt(
          session.metadata?.duration_months || '6'
        )

        if (!planKey) {
          console.error('Missing plan_key in checkout session metadata')
          break
        }

        // New flow: supabase_user_id is absent — the user creates their account
        // on /pago/exito after payment. Activation is handled there.
        // This webhook is a fallback for legacy sessions that still carry the ID.
        if (!userId) {
          console.log(
            `[webhook] New-flow payment — activation handled on success page. plan=${planKey}`
          )
          break
        }

        // Calculate expiration date
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths)

        // Activate subscription in profile
        const { error: updateError } = await adminSupabase
          .from('profiles')
          .update({
            subscription_status: 'activa',
            subscription_plan: planKey,
            subscription_expires_at: expiresAt.toISOString(),
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating profile:', updateError)
          throw updateError
        }

        // Record payment
        const { error: paymentError } = await adminSupabase
          .from('pagos')
          .insert({
            user_id: userId,
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_checkout_session_id: session.id,
            monto_centavos: session.amount_total || 0,
            moneda: session.currency || 'usd',
            estado: 'completado',
            plan: planKey,
          })

        if (paymentError) {
          console.error('Error recording payment:', paymentError)
          // Don't throw — subscription is already active
        }

        // Send purchase confirmation email + mark pending shipment
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('email, nombre_completo, direccion')
          .eq('id', userId)
          .single()

        if (profile?.email) {
          sendPurchaseConfirmationEmail({
            to: profile.email,
            nombre: profile.nombre_completo || profile.email,
            plan: planKey,
            direccion: profile.direccion || null,
          }).catch((err) => console.error('[webhook] purchase email error:', err))

          // Notify GHL — compra event (fire-and-forget)
          notifyGHL({
            email: profile.email,
            nombre: profile.nombre_completo || profile.email,
            telefono: null,
            plan: planKey,
            event: 'compra',
          }).catch(() => { /* already logged inside notifyGHL */ })
        }

        await adminSupabase
          .from('profiles')
          .update({ envio_estado: 'pendiente' })
          .eq('id', userId)

        console.log(
          `✅ Subscription activated: user=${userId} plan=${planKey} expires=${expiresAt.toISOString()}`
        )
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error(
          'Payment failed:',
          paymentIntent.id,
          paymentIntent.last_payment_error?.message
        )
        break
      }

      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
