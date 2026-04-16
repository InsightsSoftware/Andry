import { streamText } from 'ai'
import { aiModel, SYSTEM_PROMPT } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { aiChatLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

// Validate incoming messages shape
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})

const requestSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, 'Al menos un mensaje requerido')
    .max(50, 'Demasiados mensajes'),
  conversationId: z.string().uuid().optional().nullable(),
})

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

  // Rate limiting — 20 requests/minute per user
  const { success: withinLimit, remaining } = aiChatLimiter.check(user.id)
  if (!withinLimit) {
    return Response.json(
      { error: 'Has enviado demasiados mensajes. Espera un momento e intenta de nuevo.' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }

  // Validate and sanitize input
  let parsed: z.infer<typeof requestSchema>
  try {
    const body = await req.json()
    parsed = requestSchema.parse(body)
  } catch (err) {
    return Response.json(
      { error: 'Datos de mensaje inválidos' },
      { status: 400 }
    )
  }

  const { messages, conversationId } = parsed

  // Strip any messages with 'system' role (prevent prompt injection via client)
  const safeMessages = messages.filter(
    (m) => m.role === 'user' || m.role === 'assistant'
  )

  // Save user message to DB
  if (conversationId && safeMessages.length > 0) {
    const lastUserMsg = safeMessages[safeMessages.length - 1]
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
    messages: safeMessages,
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
