'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Validation ───────────────────────────────────────────────────

const videoInputSchema = z.object({
  partner_id: z.string().uuid(),
  titulo: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().max(500).or(z.literal('')).optional(),
  video_url: z.string().trim().min(1), // YouTube URL o path de Supabase storage
  orden: z.number().int().min(0).default(0),
})

export type PartnerVideoInput = z.input<typeof videoInputSchema>

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

export async function createPartnerVideo(input: PartnerVideoInput) {
  await requireAdmin()
  const parsed = videoInputSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { error: `Datos inválidos: ${msg}` }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('partner_videos')
    .insert({
      ...parsed.data,
      descripcion: parsed.data.descripcion || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true, video: data }
}

export async function updatePartnerVideo(id: string, input: PartnerVideoInput) {
  await requireAdmin()
  const parsed = videoInputSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { error: `Datos inválidos: ${msg}` }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('partner_videos')
    .update({
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      video_url: parsed.data.video_url,
      orden: parsed.data.orden,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true }
}

export async function deletePartnerVideo(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('partner_videos').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true }
}

/** Persist a new order. Receives the partner_videos ids in the desired order. */
export async function reorderPartnerVideos(orderedIds: string[]) {
  await requireAdmin()
  const admin = createAdminClient()

  // Update each video's orden to its index.
  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      admin.from('partner_videos').update({ orden: idx }).eq('id', id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/admin/partners')
  revalidatePath('/aliados')
  return { success: true }
}
