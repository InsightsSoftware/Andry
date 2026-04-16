'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/validations'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planFromUrl = searchParams.get('plan')

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    telefono: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else {
        setError('Error al crear la cuenta. Inténtalo de nuevo.')
      }
      setLoading(false)
      return
    }

    // If user came from pricing page with a plan, redirect to checkout
    if (planFromUrl && (planFromUrl === 'basico' || planFromUrl === 'premium')) {
      router.push(`/precios?plan=${planFromUrl}&registered=true`)
    } else {
      router.push('/precios?registered=true')
    }
  }

  return (
    <Card className="w-full max-w-md" padding="lg">
      <div className="mb-6 text-center">
        <GraduationCap className="mx-auto mb-3 h-10 w-10 text-primary-600" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Crear Cuenta
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {planFromUrl
            ? 'Crea tu cuenta para continuar con tu compra'
            : 'Regístrate para comenzar a estudiar'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre completo"
          name="nombre_completo"
          placeholder="Tu nombre y apellido"
          value={formData.nombre_completo}
          onChange={handleChange}
          autoComplete="name"
          required
        />
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          placeholder="tu@correo.com"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
        <Input
          label="Teléfono (opcional)"
          name="telefono"
          type="tel"
          placeholder="(305) 555-1234"
          value={formData.telefono}
          onChange={handleChange}
          autoComplete="tel"
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          helperText="Debe tener al menos 8 caracteres, una mayúscula y un número"
          required
        />

        {error && (
          <p className="rounded-lg bg-danger-500/10 dark:bg-danger-500/20 px-4 py-2 text-sm text-danger-500">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg">
          Crear Cuenta
        </Button>
      </form>

      <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-4 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary-600 hover:underline"
          >
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </Card>
  )
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
