'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const tipo = formData.get('tipo') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const contenido = (formData.get('contenido') as string)?.trim()
  const ubicacion = (formData.get('ubicacion') as string)?.trim() || null
  const presupuesto = (formData.get('presupuesto') as string)?.trim() || null

  if (!titulo || titulo.length < 5) {
    return { error: 'El titulo debe tener al menos 5 caracteres' }
  }
  if (!contenido || contenido.length < 10) {
    return { error: 'El contenido debe tener al menos 10 caracteres' }
  }
  if (!tipo || !['duda', 'trabajo'].includes(tipo)) {
    return { error: 'Tipo de post invalido' }
  }

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

export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const postId = formData.get('post_id') as string
  const contenido = (formData.get('contenido') as string)?.trim()

  if (!contenido || contenido.length < 2) {
    return { error: 'El comentario debe tener al menos 2 caracteres' }
  }

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
