'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import { loginSchema } from '@/lib/validations'
import { loginAction } from '@/actions/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/panel'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Client-side validation first
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.set('email', email)
    formData.set('password', password)

    const res = await loginAction(formData)

    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md" padding="lg">
      <div className="mb-6 text-center">
        <GraduationCap className="mx-auto mb-3 h-10 w-10 text-primary-600" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Iniciar Sesión
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Ingresa a tu cuenta para estudiar
        </p>
      </div>

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
        <Input
          label="Contraseña"
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="rounded-lg bg-danger-500/10 dark:bg-danger-500/20 px-4 py-2 text-sm text-danger-500">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg">
          Iniciar Sesión
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/recuperar"
          className="text-sm text-primary-600 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-4 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          ¿No tienes cuenta?{' '}
          <Link
            href="/registro"
            className="font-semibold text-primary-600 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
