'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PLANS, isPaymentsSimulated, getStripe, type PlanKey } from '@/lib/stripe'
import { registerSchema } from '@/lib/validations'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

type PurchaseInput = {
  nombre_completo: string
  email: string
  password: string
  telefono: string
  direccion: string
  oficio: string
}

type PaymentProof =
  | { type: 'simulated' }
  | { type: 'stripe'; sessionId: string }

export type CompletePurchaseResult =
  | { success: true; email: string }
  | { error: string }

export async function completePurchase(
  formData: PurchaseInput,
  planKey: PlanKey,
  proof: PaymentProof
): Promise<CompletePurchaseResult> {
  // --- 1. Validate form data ---
  const parsed = registerSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (!PLANS[planKey]) {
    return { error: 'Plan inválido' }
  }

  // --- 2. Verify payment proof ---
  if (proof.type === 'stripe' && !isPaymentsSimulated()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(proof.sessionId)
      if (session.payment_status !== 'paid') {
        return { error: 'El pago no fue procesado correctamente.' }
      }
      if (session.metadata?.plan_key !== planKey) {
        return { error: 'El plan no coincide con el pago registrado.' }
      }
    } catch {
      return { error: 'No se pudo verificar el pago. Contactá soporte.' }
    }
  }
  // In simulated mode we trust the plan param — no real money involved

  // --- 3. Create Supabase user via admin ---
  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,          // skip email confirmation — user can sign in immediately
    user_metadata: {
      nombre_completo: formData.nombre_completo,
      telefono: formData.telefono,
      direccion: formData.direccion,
      oficio: formData.oficio,
    },
  })

  if (createError) {
    const msg = createError.message.toLowerCase()
    // Supabase returns several variants when email is already taken
    if (
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      msg.includes('email address already') ||
      msg.includes('duplicate') ||
      msg.includes('unique') ||
      createError.status === 422
    ) {
      return {
        error:
          'Este correo ya tiene una cuenta activa. Iniciá sesión en su lugar.',
      }
    }
    console.error('[completePurchase] createUser error:', createError.message, createError.status)
    return { error: `Error al crear la cuenta: ${createError.message}` }
  }

  const userId = created.user.id

  // --- 4. Activate subscription (upsert handles race with DB trigger) ---
  const plan = PLANS[planKey]
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths)

  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: formData.email,
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        direccion: formData.direccion,
        subscription_status: 'activa',
        subscription_plan: planKey,
        subscription_expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.error('[completePurchase] profile upsert error:', profileError)
    // Don't return error — the account exists; subscription can be fixed manually
  }

  // --- 5. Record payment ---
  const stripeSessionId =
    proof.type === 'stripe' ? proof.sessionId : `sim_cs_${Date.now()}`
  const stripePaymentId =
    proof.type === 'stripe' ? '' : `sim_pi_${Date.now()}`

  await admin
    .from('pagos')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: stripePaymentId,
      stripe_checkout_session_id: stripeSessionId,
      monto_centavos: planKey === 'premium' ? 59900 : 29900,
      moneda: 'usd',
      estado: 'completado',
      plan: planKey,
    })
    .then(({ error }) => {
      if (error) console.error('[completePurchase] pagos insert error:', error)
    })

  // Send purchase confirmation email (fire-and-forget)
  sendPurchaseConfirmationEmail({
    to: formData.email,
    nombre: formData.nombre_completo,
    plan: planKey,
    direccion: formData.direccion || null,
  }).catch((err) => console.error('[completePurchase] email error:', err))

  // Mark as pending shipment (update profile)
  admin
    .from('profiles')
    .update({ envio_estado: 'pendiente' })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.error('[completePurchase] envio_estado update error:', error)
    })

  return { success: true, email: formData.email }
}

// ─── Activate subscription for a user who ALREADY has an account ─────────────
export async function activateExistingSubscription(
  planKey: PlanKey,
  proof: PaymentProof
): Promise<CompletePurchaseResult> {
  // Verify the caller is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado.' }
  }

  if (!PLANS[planKey]) {
    return { error: 'Plan inválido' }
  }

  // Verify payment (same logic as completePurchase)
  if (proof.type === 'stripe' && !isPaymentsSimulated()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(proof.sessionId)
      if (session.payment_status !== 'paid') {
        return { error: 'El pago no fue procesado correctamente.' }
      }
      if (session.metadata?.plan_key !== planKey) {
        return { error: 'El plan no coincide con el pago registrado.' }
      }
    } catch {
      return { error: 'No se pudo verificar el pago. Contactá soporte.' }
    }
  }

  const admin = createAdminClient()
  const plan = PLANS[planKey]
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths)

  const { error: subError } = await admin
    .from('profiles')
    .update({
      subscription_status: 'activa',
      subscription_plan: planKey,
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', user.id)

  if (subError) {
    console.error('[activateExistingSubscription] error:', subError)
    return { error: 'Error al activar la suscripción. Contactá soporte.' }
  }

  // Record payment
  const stripeSessionId =
    proof.type === 'stripe' ? proof.sessionId : `sim_cs_${Date.now()}`
  const stripePaymentId =
    proof.type === 'stripe' ? '' : `sim_pi_${Date.now()}`

  await admin
    .from('pagos')
    .insert({
      user_id: user.id,
      stripe_payment_intent_id: stripePaymentId,
      stripe_checkout_session_id: stripeSessionId,
      monto_centavos: planKey === 'premium' ? 59900 : 29900,
      moneda: 'usd',
      estado: 'completado',
      plan: planKey,
    })
    .then(({ error }) => {
      if (error) console.error('[activateExistingSubscription] pagos error:', error)
    })

  // Send purchase confirmation email (fire-and-forget)
  if (user.email) {
    const { data: profile } = await admin
      .from('profiles')
      .select('nombre_completo, direccion')
      .eq('id', user.id)
      .single()

    sendPurchaseConfirmationEmail({
      to: user.email,
      nombre: profile?.nombre_completo || user.email,
      plan: planKey,
      direccion: profile?.direccion || null,
    }).catch((err) => console.error('[activateExistingSubscription] email error:', err))

    // Mark as pending shipment
    admin
      .from('profiles')
      .update({ envio_estado: 'pendiente' })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.error('[activateExistingSubscription] envio_estado error:', error)
      })
  }

  return { success: true, email: user.email ?? '' }
}
