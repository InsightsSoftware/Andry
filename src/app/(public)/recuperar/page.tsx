'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { GraduationCap, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema } from '@/lib/validations'

export default function RecoverPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }
    )

    if (resetError) {
      setError('Error al enviar el correo. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-6 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-primary-600" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Recuperar Contraseña
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-success-500" />
            <h2 className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Correo enviado
            </h2>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue
              las instrucciones para restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {error && (
                <p className="rounded-lg bg-danger-500/10 dark:bg-danger-500/20 px-4 py-2 text-sm text-danger-500">
                  {error}
                </p>
              )}

              <Button type="submit" fullWidth loading={loading} size="lg">
                Enviar Enlace
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Iniciar Sesión
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
