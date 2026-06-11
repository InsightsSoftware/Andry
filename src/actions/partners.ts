'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Validation ───────────────────────────────────────────────────

const partnerInputSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  descripcion: z.string().trim().min(10).max(500),
  categoria: z.string().trim().min(2, 'Escribí una categoría').max(40),
  logo_url: z.string().trim().url().or(z.literal('')).optional(),
  imagen_portada: z.string().trim().optional(),
  video_url: z.string().trim().min(1),
  sitio_web: z.string().trim().url().or(z.literal('')).optional(),
  telefono: z.string().trim().max(40).optional(),
  email_contacto: z.string().trim().email().or(z.literal('')).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  cta_text: z.string().trim().min(2).max(40).default('Contactar'),
  orden: z.number().int().min(0).default(0),
  destacado: z.boolean().default(false),
  activo: z.boolean().default(true),
})

export type PartnerInput = z.input<typeof partnerInputSchema>

// ─── Helper: require admin/root ───────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.rol !== 'admin' && profile?.rol !== 'root') {
    throw new Error('No autorizado')
  }
  return user
}

// ─── CRUD ──────────────────────────────────────────────────────────

export async function listPartnersAdmin() {
  await requireAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('partners')
    .select('*')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { success: true, partners: data }
}

export async function createPartner(input: PartnerInput) {
  await requireAdmin()
  const parsed = partnerInputSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { error: `Datos inválidos: ${msg}` }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('partners')
    .insert({
      ...parsed.data,
      logo_url: parsed.data.logo_url || null,
      imagen_portada: parsed.data.imagen_portada || null,
      sitio_web: parsed.data.sitio_web || null,
      telefono: parsed.data.telefono || null,
      email_contacto: parsed.data.email_contacto || null,
      whatsapp: parsed.data.whatsapp || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un partner con ese slug' }
    return { error: error.message }
  }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true, partner: data }
}

export async function updatePartner(id: string, input: PartnerInput) {
  await requireAdmin()
  const parsed = partnerInputSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { error: `Datos inválidos: ${msg}` }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('partners')
    .update({
      ...parsed.data,
      logo_url: parsed.data.logo_url || null,
      imagen_portada: parsed.data.imagen_portada || null,
      sitio_web: parsed.data.sitio_web || null,
      telefono: parsed.data.telefono || null,
      email_contacto: parsed.data.email_contacto || null,
      whatsapp: parsed.data.whatsapp || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true }
}

export async function deletePartner(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('partners').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true }
}

export async function togglePartnerActive(id: string, activo: boolean) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('partners').update({ activo }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true }
}

// Note: category labels moved to src/lib/partners.ts so client components
// can import them (server action files only export async functions).
