'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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

function revalidateAll() {
  revalidatePath('/admin/videos')
  revalidatePath('/estudio/videos')
}

// ── CRUD categorías ────────────────────────────────────────────────

export async function createVideoCategoria(data: {
  nombre: string
  descripcion?: string
  imagen_url?: string
  orden?: number
}) {
  await requireAdmin()
  const admin = createAdminClient()

  const nombre = data.nombre.trim()
  if (!nombre) return { error: 'El nombre es obligatorio' }

  const { error } = await admin.from('video_categorias').insert({
    nombre,
    descripcion: data.descripcion?.trim() || null,
    imagen_url: data.imagen_url?.trim() || null,
    orden: data.orden ?? 0,
  })

  if (error) return { error: 'Error al crear categoría: ' + error.message }
  revalidateAll()
  return { success: true }
}

export async function updateVideoCategoria(
  id: string,
  data: {
    nombre?: string
    descripcion?: string
    imagen_url?: string
    orden?: number
    activo?: boolean
  }
) {
  await requireAdmin()
  const admin = createAdminClient()

  const payload: Record<string, unknown> = {}
  if (data.nombre !== undefined) payload.nombre = data.nombre.trim()
  if (data.descripcion !== undefined)
    payload.descripcion = data.descripcion.trim() || null
  if (data.imagen_url !== undefined)
    payload.imagen_url = data.imagen_url.trim() || null
  if (data.orden !== undefined) payload.orden = data.orden
  if (data.activo !== undefined) payload.activo = data.activo

  const { error } = await admin
    .from('video_categorias')
    .update(payload)
    .eq('id', id)

  if (error) return { error: 'Error al actualizar categoría' }
  revalidateAll()
  return { success: true }
}

export async function deleteVideoCategoria(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  // FK is ON DELETE SET NULL — videos keep existing, just lose the category
  const { error } = await admin
    .from('video_categorias')
    .delete()
    .eq('id', id)

  if (error) return { error: 'Error al eliminar categoría' }
  revalidateAll()
  return { success: true }
}

// ── Asignar / quitar video de categoría ────────────────────────────

export async function assignVideoToCategoria(
  videoId: string,
  categoriaId: string | null
) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('contenido')
    .update({ video_categoria_id: categoriaId })
    .eq('id', videoId)

  if (error) return { error: 'Error al asignar video a categoría' }
  revalidateAll()
  return { success: true }
}
