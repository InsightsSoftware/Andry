'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user
}

/**
 * Upload a profile avatar image.
 * Accepts raw bytes (from a canvas crop) and stores them directly using
 * the admin client (bypasses storage RLS so the bucket just needs to be public).
 */
export async function uploadAvatar(imageBytes: number[], mimeType: string) {
  const user = await requireUser()
  const admin = createAdminClient()

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.id}/avatar_${Date.now()}.${ext}`

  // Convert number[] back to Uint8Array → Blob
  const uint8 = new Uint8Array(imageBytes)

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, uint8, { contentType: mimeType, upsert: true })

  if (upErr) return { error: `Error al subir imagen: ${upErr.message}` }

  // Build public URL
  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  // Delete old avatar from storage (best-effort)
  const { data: oldProfile } = await admin
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  if (oldProfile?.avatar_url) {
    try {
      const oldPath = new URL(oldProfile.avatar_url).pathname.split('/avatars/')[1]
      if (oldPath) await admin.storage.from('avatars').remove([oldPath])
    } catch { /* ignore cleanup errors */ }
  }

  // Save to profile
  const { error: dbErr } = await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (dbErr) return { error: `Error guardando perfil: ${dbErr.message}` }

  revalidatePath('/perfil')
  revalidatePath('/comunidad')
  return { success: true, url: publicUrl }
}

/**
 * Remove the current avatar and revert to initials.
 */
export async function removeAvatar() {
  const user = await requireUser()
  const admin = createAdminClient()

  // Get old URL to delete from storage
  const { data: profile } = await admin
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.avatar_url) {
    try {
      const oldPath = new URL(profile.avatar_url).pathname.split('/avatars/')[1]
      if (oldPath) await admin.storage.from('avatars').remove([oldPath])
    } catch { /* ignore */ }
  }

  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  revalidatePath('/comunidad')
  return { success: true }
}
