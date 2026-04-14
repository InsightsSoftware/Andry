'use client'

import { useState } from 'react'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  rol: 'user' | 'assistant'
  contenido: string
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      rol: 'user',
      contenido: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // TODO: Connect to AI API route
    // For now, show a placeholder response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        rol: 'assistant',
        contenido:
          'El asistente IA se está configurando. Pronto podré responder tus preguntas sobre el examen de licencia. Esta funcionalidad estará disponible cuando se conecte la API de IA.',
      }
      setMessages((prev) => [...prev, aiMessage])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col md:h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Asistente IA</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Pregunta lo que sea sobre el examen de licencia
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-3 h-12 w-12 text-primary-300 dark:text-primary-600" />
            <h2 className="mb-1 font-bold text-neutral-700 dark:text-neutral-300">
              ¿En qué te puedo ayudar?
            </h2>
            <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              Preguntame sobre cualquier tema del examen. Te explico con
              ejemplos y te digo la página del libro donde encontrar la
              respuesta.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.rol === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.rol === 'user'
                      ? 'bg-primary-100 dark:bg-primary-800/30'
                      : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                >
                  {msg.rol === 'user' ? (
                    <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.rol === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {msg.contenido}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Bot className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500 [animation-delay:0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500 [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="flex-1 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none min-h-[48px]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
