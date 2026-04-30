/**
 * apply-email-templates.mjs
 *
 * Aplica los templates de email en español al proyecto de Supabase
 * usando la Management API.
 *
 * USO:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node supabase/apply-email-templates.mjs
 *
 * Para obtener el access token:
 *   https://supabase.com/dashboard/account/tokens → "Generate new token"
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF = 'hrlqteczbwyjickradbt'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!ACCESS_TOKEN) {
  console.error('❌  Falta SUPABASE_ACCESS_TOKEN')
  console.error('   Ejemplo: SUPABASE_ACCESS_TOKEN=sbp_xxx node supabase/apply-email-templates.mjs')
  process.exit(1)
}

const tpl = (name) =>
  readFileSync(join(__dirname, 'email-templates', name), 'utf8')

const body = {
  // ── Confirmación de cuenta ──────────────────────────────────────────
  mailer_templates_confirmation_content: tpl('confirm.html'),
  mailer_templates_confirmation_subject: 'Confirmá tu cuenta en Y Exam Prep',

  // ── Recuperación de contraseña ──────────────────────────────────────
  mailer_templates_recovery_content: tpl('recovery.html'),
  mailer_templates_recovery_subject: 'Recuperá tu contraseña de Y Exam Prep',

  // ── Cambio de email ─────────────────────────────────────────────────
  mailer_templates_email_change_content: tpl('email-change.html'),
  mailer_templates_email_change_subject: 'Confirmá tu nuevo email en Y Exam Prep',
}

console.log('📤  Aplicando templates...')

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
)

if (!res.ok) {
  const text = await res.text()
  console.error(`❌  Error ${res.status}:`, text)
  process.exit(1)
}

const data = await res.json()
console.log('✅  Templates aplicados correctamente')
console.log(`   • Confirmación:       "${data.mailer_templates_confirmation_subject ?? '—'}"`)
console.log(`   • Recuperación:       "${data.mailer_templates_recovery_subject ?? '—'}"`)
console.log(`   • Cambio de email:    "${data.mailer_templates_email_change_subject ?? '—'}"`)
