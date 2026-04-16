'use server'

import { createClient } from '@/lib/supabase/server'

export async function createConversation() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { data, error } = await supabase
    .from('conversaciones_ai')
    .insert({
      user_id: user.id,
      titulo: null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return { error: 'Error al crear conversación' }
  }

  return { conversationId: data.id }
}

export async function getConversations() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado', conversations: [] }

  const { data, error } = await supabase
    .from('conversaciones_ai')
    .select('id, titulo, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching conversations:', error)
    return { error: 'Error al cargar conversaciones', conversations: [] }
  }

  return { conversations: data || [] }
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado', messages: [] }

  // Verify ownership
  const { data: conv } = await supabase
    .from('conversaciones_ai')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conv) return { error: 'Conversación no encontrada', messages: [] }

  const { data, error } = await supabase
    .from('mensajes_ai')
    .select('id, rol, contenido, created_at')
    .eq('conversacion_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return { error: 'Error al cargar mensajes', messages: [] }
  }

  return {
    messages: (data || []).map((m) => ({
      id: m.id,
      role: m.rol as 'user' | 'assistant',
      content: m.contenido,
    })),
  }
}

export async function updateConversationTitle(
  conversationId: string,
  titulo: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  await supabase
    .from('conversaciones_ai')
    .update({ titulo })
    .eq('id', conversationId)
    .eq('user_id', user.id)

  return { success: true }
}

export async function deleteConversation(conversationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  // Verify ownership BEFORE deleting anything
  const { data: conv } = await supabase
    .from('conversaciones_ai')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conv) return { error: 'Conversación no encontrada' }

  // Delete messages first (only after ownership confirmed)
  await supabase
    .from('mensajes_ai')
    .delete()
    .eq('conversacion_id', conversationId)

  // Then delete conversation
  await supabase
    .from('conversaciones_ai')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  return { success: true }
}
