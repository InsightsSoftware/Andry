'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send,
  Bot,
  User,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  createConversation,
  getConversations,
  getMessages,
  updateConversationTitle,
  deleteConversation,
} from '@/actions/ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  titulo: string | null
  updated_at: string
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = useCallback(async () => {
    const result = await getConversations()
    if (result.conversations) {
      setConversations(result.conversations)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleNewChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setActiveConvId(null)
    setMessages([])
    setApiError(null)
    setIsLoading(false)
    setShowSidebar(false)
  }, [])

  const handleSelectConversation = useCallback(async (convId: string) => {
    if (abortRef.current) abortRef.current.abort()
    setActiveConvId(convId)
    setApiError(null)
    setIsLoading(false)
    const result = await getMessages(convId)
    if (result.messages) {
      setMessages(result.messages)
    }
    setShowSidebar(false)
  }, [])

  const handleDeleteConversation = useCallback(
    async (convId: string) => {
      await deleteConversation(convId)
      if (activeConvId === convId) {
        handleNewChat()
      }
      loadConversations()
    },
    [activeConvId, handleNewChat, loadConversations]
  )

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      setApiError(null)

      const userContent = input.trim()
      setInput('')

      // Create conversation on first message
      let convId = activeConvId
      if (!convId) {
        const result = await createConversation()
        if (result.conversationId) {
          convId = result.conversationId
          setActiveConvId(convId)
        } else {
          setApiError(result.error || 'Error al crear conversación')
          return
        }
      }

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: userContent,
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '',
      }

      const newMessages = [...messages, userMsg]
      setMessages([...newMessages, assistantMsg])
      setIsLoading(true)

      // Build message history for API (simple role/content format)
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      try {
        const controller = new AbortController()
        abortRef.current = controller

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            conversationId: convId,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(
            errorData?.error || `Error ${response.status}`
          )
        }

        if (!response.body) {
          throw new Error('No response stream')
        }

        // Read the text stream
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk

          // Update the assistant message with accumulated text
          const currentText = fullText
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (updated[lastIdx]?.role === 'assistant') {
              updated[lastIdx] = { ...updated[lastIdx], content: currentText }
            }
            return updated
          })
        }

        // Auto-title the conversation after first exchange
        if (newMessages.length === 1) {
          const title =
            userContent.length > 50
              ? userContent.slice(0, 47) + '...'
              : userContent
          await updateConversationTitle(convId, title)
          loadConversations()
        } else {
          loadConversations()
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Error al conectar con el asistente'
        setApiError(errorMessage)
        // Remove the empty assistant message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantMsg.id)
        )
      } finally {
        setIsLoading(false)
        abortRef.current = null
        loadConversations()
      }
    },
    [input, isLoading, messages, activeConvId, loadConversations]
  )

  const suggestions = [
    '¿Qué temas cubre el examen de contratista?',
    '¿Cómo funciona la Lien Law en Florida?',
    '¿Cuáles son los requisitos de OSHA?',
    'Explícame Workers Compensation',
  ]

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Asistente IA
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Pregunta lo que sea sobre el examen de licencia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Historial de conversaciones"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={handleNewChat}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-600 dark:bg-primary-500 px-3 text-sm font-medium text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 min-h-0">
        {/* Conversation sidebar */}
        {showSidebar && (
          <>
            <div
              className="fixed inset-0 z-10 bg-black/30 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <div className="absolute left-0 top-0 z-20 h-full w-72 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 shadow-lg md:relative md:mr-3 md:shadow-none overflow-y-auto">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                Conversaciones
              </p>
              {conversations.length === 0 ? (
                <p className="px-1 text-sm text-neutral-400 dark:text-neutral-500">
                  Sin conversaciones aún
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors ${
                        activeConvId === conv.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      <span className="flex-1 truncate text-sm">
                        {conv.titulo || 'Nueva conversación'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conv.id)
                        }}
                        className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
            {messages.length === 0 && !apiError ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
                  <Sparkles className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="mb-1 text-lg font-bold text-neutral-700 dark:text-neutral-300">
                  ¿En qué te puedo ayudar?
                </h2>
                <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                  Preguntame sobre cualquier tema del examen de contratista. Te
                  explico con ejemplos y te digo la página del libro.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800 hover:text-primary-700 dark:hover:text-primary-400 transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {apiError && (
                  <div className="flex items-center gap-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 p-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" />
                    <p className="text-sm text-warning-700 dark:text-warning-400">
                      {apiError}
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === 'user'
                          ? 'bg-primary-100 dark:bg-primary-800/30'
                          : 'bg-neutral-100 dark:bg-neutral-800'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Bot className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        msg.content ? (
                          <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500 [animation-delay:0.1s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500 [animation-delay:0.2s]" />
                          </div>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none min-h-[48px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
