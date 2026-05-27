/**
 * GoHighLevel (GHL) Inbound Webhook Integration
 *
 * Sends contact/event data to GHL to trigger automations.
 * Works with any GHL plan that supports inbound webhooks.
 *
 * Env var required (set in Render):
 *   GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/<your-id>
 *
 * If GHL_WEBHOOK_URL is not set, all calls are silently skipped (safe to deploy first).
 */

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL

// ── Event types ───────────────────────────────────────────────────────────────

export type GHLEvent = 'registro' | 'compra' | 'vencimiento'

export interface GHLContactData {
  email: string
  nombre: string
  telefono?: string | null
  /** e.g. 'basico' | 'premium' */
  plan?: string | null
  event: GHLEvent
}

/**
 * Map our internal event + plan to a GHL tag string.
 * GHL automations filter contacts by tag to decide which workflow to run.
 *
 * Examples:
 *   registro                → tag: 'Y-Registro'
 *   compra basico           → tag: 'Y-Compra-Basico'
 *   compra premium          → tag: 'Y-Compra-Premium'
 *   vencimiento basico      → tag: 'Y-Vencimiento-Basico'
 */
function buildTag(event: GHLEvent, plan?: string | null): string {
  switch (event) {
    case 'registro':
      return 'Y-Registro'
    case 'compra':
      return plan ? `Y-Compra-${capitalise(plan)}` : 'Y-Compra'
    case 'vencimiento':
      return plan ? `Y-Vencimiento-${capitalise(plan)}` : 'Y-Vencimiento'
    default:
      return 'Y-Evento'
  }
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: POST contact data to GHL inbound webhook.
 * Never throws — errors are logged only, so they never block the main flow.
 */
export async function notifyGHL(data: GHLContactData): Promise<void> {
  if (!GHL_WEBHOOK_URL) {
    // Not configured yet — skip silently
    return
  }

  const tag = buildTag(data.event, data.plan)

  const payload = {
    // GHL standard fields
    email: data.email,
    phone: data.telefono ?? '',
    firstName: data.nombre?.split(' ')[0] ?? '',
    lastName: data.nombre?.split(' ').slice(1).join(' ') ?? '',
    // Custom fields GHL can map
    tags: [tag],
    customData: {
      plan: data.plan ?? '',
      event: data.event,
      tag,
      source: 'yexamprep.com',
    },
  }

  try {
    const res = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000), // 8s max — don't block the user
    })

    if (!res.ok) {
      console.error(`[ghl] webhook error ${res.status}: ${await res.text().catch(() => '')}`)
    } else {
      console.log(`[ghl] ✅ notified — event=${data.event} tag=${tag}`)
    }
  } catch (err) {
    // Network error, timeout, etc. — log and move on
    console.error('[ghl] webhook failed (non-blocking):', err instanceof Error ? err.message : err)
  }
}
