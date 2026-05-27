/**
 * POST /api/cron/expire-subscriptions
 *
 * Finds subscriptions that have passed their expiration date and:
 *  1. Updates their status to 'expirada' in the DB
 *  2. Notifies GHL with the 'vencimiento' event so automations can fire
 *
 * Protected by CRON_SECRET — only call from trusted sources (Render Cron Job, cron-job.org, etc.)
 *
 * Env var required:
 *   CRON_SECRET=any-long-random-string   (set in Render)
 *
 * Schedule suggestion: daily at 6am UTC
 *   Render → Environment → Cron Jobs → "0 6 * * *" → /api/cron/expire-subscriptions
 *   Or use cron-job.org with Authorization header: Bearer <CRON_SECRET>
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyGHL } from '@/lib/ghl'

export async function POST(request: Request) {
  // Validate cron secret
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Find subscriptions that are still 'activa' but have passed expiry
  const { data: expired, error } = await admin
    .from('profiles')
    .select('id, email, nombre_completo, subscription_plan, subscription_expires_at')
    .eq('subscription_status', 'activa')
    .lt('subscription_expires_at', now)
    .not('subscription_expires_at', 'is', null)

  if (error) {
    console.error('[cron/expire-subscriptions] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    console.log('[cron/expire-subscriptions] no expired subscriptions found')
    return NextResponse.json({ expired: 0 })
  }

  console.log(`[cron/expire-subscriptions] found ${expired.length} expired subscription(s)`)

  let processed = 0
  const errors: string[] = []

  for (const profile of expired) {
    // 1. Mark as expired in DB
    const { error: updateError } = await admin
      .from('profiles')
      .update({ subscription_status: 'expirada' })
      .eq('id', profile.id)

    if (updateError) {
      console.error(`[cron/expire-subscriptions] update error for ${profile.id}:`, updateError)
      errors.push(profile.id)
      continue
    }

    // 2. Notify GHL (fire-and-forget but awaited here so we can log the result)
    if (profile.email) {
      await notifyGHL({
        email: profile.email,
        nombre: profile.nombre_completo || profile.email,
        telefono: null,
        plan: profile.subscription_plan,
        event: 'vencimiento',
      }).catch((err) => {
        console.error(`[cron/expire-subscriptions] GHL notify error for ${profile.id}:`, err)
      })
    }

    processed++
    console.log(`[cron/expire-subscriptions] expired: ${profile.email} (plan: ${profile.subscription_plan})`)
  }

  return NextResponse.json({
    expired: expired.length,
    processed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
