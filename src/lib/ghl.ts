/**
 * GoHighLevel (GHL) Inbound Webhook Integration
 *
 * Envía datos de contacto a GHL cuando un estudiante se registra, compra, o
 * se le vence la suscripción. GHL filtra automations por el campo "tag".
 *
 * IMPORTANTE: el payload coincide EXACTAMENTE con el sample request que Andry
 * mapeó en GHL: { nombre, apellidos, email, telefono, tag }.
 * Si cambiás estas keys, GHL deja de reconocer los campos en el contacto.
 *
 * La URL del webhook se puede override con la env var GHL_WEBHOOK_URL.
 */

const DEFAULT_GHL_WEBHOOK_URL =
  'https://services.leadconnectorhq.com/hooks/F5LCZPUqR16Gz4ftvpAv/webhook-trigger/88f1dc1f-dfbe-4b6d-bb46-6e82a50edd5e'

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL || DEFAULT_GHL_WEBHOOK_URL

// ── Event types ───────────────────────────────────────────────────────────────

export type GHLEvent = 'registro' | 'compra' | 'vencimiento'

export interface GHLContactData {
  email: string
  /** Nombre completo — se separa en nombre/apellidos dentro de notifyGHL */
  nombre: string
  telefono?: string | null
  /** Plan comprado: 'basico' | 'premium' (eventos compra/vencimiento) */
  plan?: string | null
  /** Oficio/categoría que eligió el usuario al registrarse (evento registro) */
  oficio?: string | null
  event: GHLEvent
}

// ── Plan → nombre legible ──────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  basico:  'Plan Básico',
  premium: 'Plan Premium',
}

/**
 * El "tag" que ve Andry en GHL = nombre del curso/categoría.
 *   registro    → el oficio elegido (ej: "General Contractor")
 *   compra      → el plan comprado (ej: "Plan Premium")
 *   vencimiento → "Vencimiento <plan>"
 */
function buildTag(data: GHLContactData): string {
  switch (data.event) {
    case 'registro':
      return data.oficio || 'Registro'
    case 'compra':
      return data.plan ? (PLAN_LABELS[data.plan] ?? data.plan) : 'Compra'
    case 'vencimiento':
      return data.plan
        ? `Vencimiento ${PLAN_LABELS[data.plan] ?? data.plan}`
        : 'Vencimiento'
    default:
      return 'Evento'
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: POST contact data to GHL inbound webhook.
 * Never throws — errors are logged only, so they never block the main flow.
 */
export async function notifyGHL(data: GHLContactData): Promise<void> {
  if (!GHL_WEBHOOK_URL) return

  // GHL pidió "Nombre" y "Apellidos" separados; el form sólo guarda nombre
  // completo, así que lo partimos: primer token = nombre, el resto = apellidos.
  const parts = (data.nombre ?? '').trim().split(/\s+/)
  const nombre = parts[0] ?? ''
  const apellidos = parts.slice(1).join(' ')

  const payload = {
    nombre,
    apellidos,
    email: data.email,
    telefono: data.telefono ?? '',
    tag: buildTag(data),
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
      console.log(`[ghl] ✅ notified — event=${data.event} tag=${payload.tag}`)
    }
  } catch (err) {
    // Network error, timeout, etc. — log and move on
    console.error('[ghl] webhook failed (non-blocking):', err instanceof Error ? err.message : err)
  }
}
