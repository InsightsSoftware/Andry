'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { postDudaSchema, postTrabajoSchema, comentarioSchema } from '@/lib/validations'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
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

  const { error } = await supabase.from('posts_comunidad').insert({
    user_id: user.id,
    tipo,
    titulo,
    contenido,
    ubicacion,
    presupuesto,
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

  const { error } = await supabase.from('comentarios').insert({
    post_id: postId,
    user_id: user.id,
    contenido,
  })

  if (error) {
    console.error('Error creating comment:', error)
    return { error: 'Error al comentar' }
  }

  revalidatePath('/comunidad/dudas')
  revalidatePath('/comunidad/trabajos')
  return { success: true }
}
