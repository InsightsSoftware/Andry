'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { postDudaSchema, postTrabajoSchema, comentarioSchema } from '@/lib/validations'
import { postLimiter, commentLimiter } from '@/lib/rate-limit'

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'admin' && profile?.rol !== 'root') return null
  return user
}

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Rate limit: 20 posts per hour per user
  const { success: postOk, resetAt: postReset } = postLimiter.check(user.id)
  if (!postOk) {
    const waitMin = Math.ceil((postReset - Date.now()) / 60_000)
    return { error: `Límite de publicaciones alcanzado. Volvé a intentarlo en ${waitMin} min.` }
  }

  const tipo = formData.get('tipo') as string
  if (!tipo || !['duda', 'trabajo'].includes(tipo)) {
    return { error: 'Tipo de post inválido' }
  }

  // Validate with Zod based on post type
  const raw = {
    titulo: (formData.get('titulo') as string)?.trim(),
    contenido: (formData.get('contenido') as string)?.trim(),
    ...(tipo === 'trabajo' && {
      ubicacion: (formData.get('ubicacion') as string)?.trim() || '',
      presupuesto: (formData.get('presupuesto') as string)?.trim() || undefined,
    }),
    ...(tipo === 'duda' && {
      capitulo_id: (formData.get('capitulo_id') as string) || undefined,
    }),
  }

  const schema = tipo === 'trabajo' ? postTrabajoSchema : postDudaSchema
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Datos inválidos' }
  }

  const titulo = raw.titulo
  const contenido = raw.contenido
  const ubicacion = (formData.get('ubicacion') as string)?.trim() || null
  const presupuesto = (formData.get('presupuesto') as string)?.trim() || null

  // Parse media URLs (JSON array sent by the client)
  let mediaUrls: string[] = []
  try {
    const raw = formData.get('media_urls') as string
    if (raw) mediaUrls = JSON.parse(raw)
    if (!Array.isArray(mediaUrls)) mediaUrls = []
    // Cap at 10 total (5 images + 5 videos, enforced client-side too)
    mediaUrls = mediaUrls.slice(0, 10)
  } catch {
    mediaUrls = []
  }

  const { error } = await supabase.from('posts_comunidad').insert({
    user_id: user.id,
    tipo,
    titulo,
    contenido,
    ubicacion,
    presupuesto,
    media_urls: mediaUrls,
  })

  if (error) {
    console.error('Error creating post:', error)
    return { error: 'Error al publicar. Intentalo de nuevo.' }
  }

  revalidatePath(tipo === 'duda' ? '/comunidad/dudas' : '/comunidad/trabajos')
  return { success: true }
}

export async function markResuelto(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  // Fetch the post to verify ownership or admin
  const { data: post } = await supabase
    .from('posts_comunidad')
    .select('user_id, tipo')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post no encontrado' }

  // Check if user is admin/root
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.rol === 'admin' || profile?.rol === 'root'
  const isOwner = post.user_id === user.id

  if (!isOwner && !isAdmin) return { error: 'Sin permiso' }

  const { error } = await supabase
    .from('posts_comunidad')
    .update({ resuelto: true })
    .eq('id', postId)

  if (error) return { error: 'Error al marcar como resuelto' }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}

export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Rate limit: 60 comments per hour per user
  const { success: commentOk, resetAt: commentReset } = commentLimiter.check(user.id)
  if (!commentOk) {
    const waitMin = Math.ceil((commentReset - Date.now()) / 60_000)
    return { error: `Límite de comentarios alcanzado. Volvé a intentarlo en ${waitMin} min.` }
  }

  const postId = formData.get('post_id') as string
  const raw = {
    contenido: (formData.get('contenido') as string)?.trim(),
    parent_id: (formData.get('parent_id') as string) || undefined,
  }

  const result = comentarioSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Datos inválidos' }
  }

  const contenido = result.data.contenido

  // Optional media attachments (up to 5 images)
  // Client sends media_url_0, media_url_1, ... for each uploaded image
  const mediaUrls: string[] = []
  for (let i = 0; i < 5; i++) {
    const url = (formData.get(`media_url_${i}`) as string)?.trim()
    if (url) mediaUrls.push(url)
  }
  // Backward-compat: also accept legacy single imagen_url key
  const legacyUrl = (formData.get('imagen_url') as string)?.trim()
  if (legacyUrl && !mediaUrls.includes(legacyUrl)) mediaUrls.push(legacyUrl)

  const { error } = await supabase.from('comentarios').insert({
    post_id: postId,
    user_id: user.id,
    contenido,
    ...(mediaUrls.length > 0 ? { media_urls: mediaUrls } : {}),
  })

  if (error) {
    console.error('Error creating comment:', error)
    return { error: 'Error al comentar' }
  }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}

// ── Admin-only actions ────────────────────────────────────────────────────────

export async function deletePost(postId: string) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return { error: 'Sin permiso' }

  const admin = createAdminClient()
  const { error } = await admin.from('posts_comunidad').delete().eq('id', postId)
  if (error) return { error: 'Error al eliminar el post' }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return { error: 'Sin permiso' }

  const admin = createAdminClient()
  const { error } = await admin.from('comentarios').delete().eq('id', commentId)
  if (error) return { error: 'Error al eliminar el comentario' }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}

export async function removePostMedia(postId: string, mediaUrl: string) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return { error: 'Sin permiso' }

  const admin = createAdminClient()
  const { data: post } = await admin
    .from('posts_comunidad')
    .select('media_urls')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post no encontrado' }

  const updated = (post.media_urls as string[] || []).filter((u) => u !== mediaUrl)
  const { error } = await admin
    .from('posts_comunidad')
    .update({ media_urls: updated })
    .eq('id', postId)

  if (error) return { error: 'Error al eliminar el archivo' }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}

export async function toggleComentarioDestacado(commentId: string, destacado: boolean) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return { error: 'Sin permiso' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('comentarios')
    .update({ destacado })
    .eq('id', commentId)

  if (error) return { error: 'Error al actualizar el comentario' }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}

export async function setPostResuelto(postId: string, resuelto: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const isAdmin = profile?.rol === 'admin' || profile?.rol === 'root'

  // Only admin or post owner can change resuelto
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('posts_comunidad')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post no encontrado' }
  if (!isAdmin && post.user_id !== user.id) return { error: 'Sin permiso' }

  const { error } = await admin
    .from('posts_comunidad')
    .update({ resuelto })
    .eq('id', postId)

  if (error) return { error: 'Error al actualizar el post' }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}
