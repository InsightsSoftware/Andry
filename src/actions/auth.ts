'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { authLimiter } from '@/lib/rate-limit'
import { loginSchema, registerSchema } from '@/lib/validations'
import { sendWelcomeEmail } from '@/lib/email'
import { notifyGHL } from '@/lib/ghl'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  // In production behind Render's proxy the real IP is in x-forwarded-for
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email    = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  // Client-side Zod already validates, but double-check on server
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  // Rate limit by IP: 10 attempts per 15 minutes
  const ip = await getClientIp()
  const { success, resetAt } = authLimiter.check(`login:${ip}`)
  if (!success) {
    const waitMin = Math.ceil((resetAt - Date.now()) / 60_000)
    return { error: `Demasiados intentos. Volvé a intentarlo en ${waitMin} min.` }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Correo o contraseña incorrectos' }
    }
    return { error: 'Error al iniciar sesión. Intentalo de nuevo.' }
  }

  return { success: true }
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function registerAction(formData: FormData) {
  const data = {
    nombre_completo: (formData.get('nombre_completo') as string)?.trim(),
    email:           (formData.get('email') as string)?.trim().toLowerCase(),
    password:        formData.get('password') as string,
    telefono:        (formData.get('telefono') as string)?.trim() || '',
    direccion:       (formData.get('direccion') as string)?.trim() || '',
    oficio:          (formData.get('oficio') as string)?.trim() || '',
  }

  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  // Rate limit by IP: 10 attempts per 15 minutes
  const ip = await getClientIp()
  const { success, resetAt } = authLimiter.check(`register:${ip}`)
  if (!success) {
    const waitMin = Math.ceil((resetAt - Date.now()) / 60_000)
    return { error: `Demasiados intentos. Volvé a intentarlo en ${waitMin} min.` }
  }

  const supabase = await createClient()
  const { data: signUpData, error } = await supabase.auth.signUp({
    email:    data.email,
    password: data.password,
    options: {
      data: {
        nombre_completo: data.nombre_completo,
        telefono:        data.telefono,
        direccion:       data.direccion,
        oficio:          data.oficio,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este correo ya está registrado. Iniciá sesión.' }
    }
    return { error: 'Error al crear la cuenta. Intentalo de nuevo.' }
  }

  // Explicitly upsert oficio into profiles table.
  // The Supabase trigger may not map this field — write it directly to be safe.
  if (signUpData.user?.id) {
    const adminClient = createAdminClient()
    await adminClient
      .from('profiles')
      .update({ oficio: data.oficio })
      .eq('id', signUpData.user.id)
  }

  // Send welcome email (fire-and-forget)
  sendWelcomeEmail({
    to: data.email,
    nombre: data.nombre_completo,
  }).catch((err) => console.error('[registerAction] welcome email error:', err))

  // Notify GHL — registro event (fire-and-forget)
  notifyGHL({
    email: data.email,
    nombre: data.nombre_completo,
    telefono: data.telefono || null,
    oficio: data.oficio || null,
    event: 'registro',
  }).catch(() => { /* already logged inside notifyGHL */ })

  return { success: true }
}

// ── Sign Out ──────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
