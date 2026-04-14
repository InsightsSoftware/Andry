import { streamText } from 'ai'
import { aiModel, SYSTEM_PROMPT } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Check API key is configured
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === 'placeholder') {
    return Response.json(
      {
        error:
          'API de IA no configurada. Contacta al administrador para activar esta función.',
      },
      { status: 503 }
    )
  }

  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { messages, conversationId } = await req.json()

  // Save user message to DB
  if (conversationId && messages.length > 0) {
    const lastUserMsg = messages[messages.length - 1]
    if (lastUserMsg.role === 'user') {
      await supabase.from('mensajes_ai').insert({
        conversacion_id: conversationId,
        rol: 'user',
        contenido: lastUserMsg.content,
      })
    }
  }

  const result = streamText({
    model: aiModel,
    system: SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 1024,
    async onFinish({ text }) {
      // Save assistant response to DB
      if (conversationId) {
        await supabase.from('mensajes_ai').insert({
          conversacion_id: conversationId,
          rol: 'assistant',
          contenido: text,
        })
        await supabase
          .from('conversaciones_ai')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)
      }
    },
  })

  return result.toTextStreamResponse()
}
