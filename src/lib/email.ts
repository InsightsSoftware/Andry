/**
 * Transactional email via Resend
 * Docs: https://resend.com/docs
 *
 * Env vars needed (add to .env.local + Render):
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   EMAIL_FROM=noreply@tudominio.com  (must be verified in Resend)
 */

import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — emails disabled')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.EMAIL_FROM || 'Y Exam Prep <noreply@yexamprep.com>'

// ── Plan labels ──────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { name: string; period: string; price: string }> = {
  basico:  { name: 'Plan Básico',  period: '6 meses',  price: '$299' },
  premium: { name: 'Plan Premium', period: '12 meses', price: '$599' },
}

// ── 1. Purchase confirmation ─────────────────────────────────────────────────

interface PurchaseEmailData {
  to: string
  nombre: string
  plan: string
  direccion?: string | null
}

export async function sendPurchaseConfirmationEmail({
  to,
  nombre,
  plan,
  direccion,
}: PurchaseEmailData) {
  const resend = getResend()
  if (!resend) return

  const planInfo = PLAN_LABELS[plan] ?? { name: plan, period: '', price: '' }
  const firstName = nombre?.split(' ')[0] || nombre

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Comprobante de compra — Y Exam Prep</title>
</head>
<body style="margin:0;padding:0;background:#0f0f12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f12;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="text-align:center;padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#d4a843);border-radius:16px;padding:16px 28px;">
                <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Y Exam Prep</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#18181b;border-radius:20px;border:1px solid #27272a;padding:40px 36px;">

              <h1 style="margin:0 0 8px;color:#f9fafb;font-size:26px;font-weight:700;">
                ¡Tu compra fue exitosa, ${firstName}! 🎉
              </h1>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                Gracias por confiar en Y Exam Prep. Tu suscripción ya está activa.
              </p>

              <!-- Plan summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border-radius:14px;border:1px solid #3f3f46;padding:20px 24px;margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Plan adquirido</p>
                    <p style="margin:0;color:#f9fafb;font-size:20px;font-weight:700;">${planInfo.name}</p>
                    <p style="margin:4px 0 0;color:#a1a1aa;font-size:14px;">${planInfo.period} · ${planInfo.price}</p>
                  </td>
                  <td align="right">
                    <div style="background:linear-gradient(135deg,#7c3aed22,#d4a84322);border:1px solid #7c3aed44;border-radius:50px;padding:6px 16px;display:inline-block;">
                      <span style="color:#a78bfa;font-size:13px;font-weight:600;">✓ Activo</span>
                    </div>
                  </td>
                </tr>
              </table>

              ${direccion ? `
              <!-- Shipping notice -->
              <div style="background:#fefce822;border:1px solid #ca8a0444;border-radius:14px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 6px;color:#fbbf24;font-size:13px;font-weight:600;">📦 Envío de material físico</p>
                <p style="margin:0;color:#d1d5db;font-size:13px;line-height:1.5;">
                  Enviaremos tu guía de estudio física a:<br/>
                  <strong style="color:#f9fafb;">${direccion}</strong>
                </p>
                <p style="margin:8px 0 0;color:#a1a1aa;font-size:12px;">Si la dirección no es correcta, contactanos por WhatsApp.</p>
              </div>
              ` : ''}

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yexamprep.com'}/panel"
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:12px;padding:14px 36px;">
                  Acceder a mi cuenta →
                </a>
              </div>

              <p style="margin:0;color:#52525b;font-size:12px;text-align:center;line-height:1.6;">
                ¿Tenés alguna pregunta? Respondé este email o contactanos por WhatsApp.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding-top:24px;">
              <p style="margin:0;color:#3f3f46;font-size:12px;">
                © ${new Date().getFullYear()} Y Exam Prep · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `✅ Comprobante de compra — ${planInfo.name}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendPurchaseConfirmationEmail error:', err)
  }
}

// ── 2. Welcome email (on registration) ──────────────────────────────────────

interface WelcomeEmailData {
  to: string
  nombre: string
}

export async function sendWelcomeEmail({ to, nombre }: WelcomeEmailData) {
  const resend = getResend()
  if (!resend) return

  const firstName = nombre?.split(' ')[0] || nombre

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Y Exam Prep</title>
</head>
<body style="margin:0;padding:0;background:#0f0f12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f12;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="text-align:center;padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#d4a843);border-radius:16px;padding:16px 28px;">
                <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Y Exam Prep</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#18181b;border-radius:20px;border:1px solid #27272a;padding:40px 36px;">

              <h1 style="margin:0 0 8px;color:#f9fafb;font-size:26px;font-weight:700;">
                ¡Bienvenido, ${firstName}! 👋
              </h1>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                Tu cuenta en Y Exam Prep fue creada exitosamente. Estás a un paso de prepararte para aprobar tu examen de contratista.
              </p>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                ${[
                  { n: '1', title: 'Elegí tu plan', desc: 'Accedé a la plataforma y elegí el plan que mejor se adapte a vos.' },
                  { n: '2', title: 'Estudiá el material', desc: 'PDFs, audios, videos y más. Todo organizado por capítulos.' },
                  { n: '3', title: 'Practicá con exámenes', desc: 'Simulaciones reales con el mismo formato que el examen oficial.' },
                ].map(step => `
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36" style="vertical-align:top;padding-top:2px;">
                          <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;width:28px;height:28px;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">${step.n}</div>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0 0 2px;color:#f9fafb;font-size:14px;font-weight:600;">${step.title}</p>
                          <p style="margin:0;color:#71717a;font-size:13px;">${step.desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join('')}
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yexamprep.com'}/precios"
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:12px;padding:14px 36px;">
                  Ver planes y precios →
                </a>
              </div>

              <p style="margin:0;color:#52525b;font-size:12px;text-align:center;line-height:1.6;">
                ¿Tenés alguna pregunta? Respondé este email y te ayudamos.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding-top:24px;">
              <p style="margin:0;color:#3f3f46;font-size:12px;">
                © ${new Date().getFullYear()} Y Exam Prep · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: '¡Bienvenido a Y Exam Prep! 🎓',
      html,
    })
  } catch (err) {
    console.error('[email] sendWelcomeEmail error:', err)
  }
}
