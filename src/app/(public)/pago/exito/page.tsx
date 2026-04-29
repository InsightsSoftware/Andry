'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, Loader2, GraduationCap, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { completePurchase } from '@/actions/complete-purchase'
import { activateExistingSubscription } from '@/actions/complete-purchase'
import { OFICIOS_LISTA } from '@/lib/validations'
import type { PlanKey } from '@/lib/stripe'

const PLAN_LABELS: Record<string, { name: string; period: string; price: string }> = {
  basico:  { name: 'Plan Básico',  period: '6 meses',  price: '$299' },
  premium: { name: 'Plan Premium', period: '12 meses', price: '$599' },
}

// ─── Already-logged-in view ──────────────────────────────────────────────────
function ExistingUserActivation({
  planKey,
  sessionId,
  isSimulated,
}: {
  planKey: PlanKey
  sessionId: string
  isSimulated: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'activating' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const planInfo = PLAN_LABELS[planKey] ?? PLAN_LABELS.basico

  async function handleActivate() {
    setStatus('activating')
    const proof = isSimulated
      ? ({ type: 'simulated' } as const)
      : ({ type: 'stripe', sessionId } as const)

    const result = await activateExistingSubscription(planKey, proof)
    if ('error' in result) {
      setError(result.error)
      setStatus('error')
      return
    }
    setStatus('done')
    router.push('/panel')
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="mb-6 rounded-2xl border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 p-4 flex items-center gap-3">
        <CheckCircle className="h-6 w-6 shrink-0 text-success-500" />
        <div className="text-left">
          <p className="font-semibold text-success-800 dark:text-success-300 text-sm">
            ¡Pago confirmado!
          </p>
          <p className="text-xs text-success-700 dark:text-success-400">
            {planInfo.name} · {planInfo.period} · {planInfo.price}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <User className="mx-auto mb-3 h-10 w-10 text-primary-600 dark:text-primary-400" />
        <h2 className="mb-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Ya tenés cuenta
        </h2>
        <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
          Activamos tu suscripción en la cuenta en la que estás logueado.
        </p>

        {error && (
          <p className="mb-4 rounded-xl bg-danger-500/10 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}

        <button
          onClick={handleActivate}
          disabled={status === 'activating' || status === 'done'}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors cursor-pointer"
        >
          {status === 'activating' ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Activando…</>
          ) : (
            <><CheckCircle className="h-4 w-4" />Activar suscripción</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── New-user registration form ──────────────────────────────────────────────
function RegistrationForm({
  planKey,
  sessionId,
  isSimulated,
}: {
  planKey: PlanKey
  sessionId: string
  isSimulated: boolean
}) {
  const router = useRouter()
  const planInfo = PLAN_LABELS[planKey] ?? PLAN_LABELS.basico

  const [step, setStep] = useState<'form' | 'signing-in' | 'done'>('form')
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    oficio: '',
  })
  const [error, setError] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStep('signing-in')

    const proof = isSimulated
      ? ({ type: 'simulated' } as const)
      : ({ type: 'stripe', sessionId } as const)

    const result = await completePurchase(formData, planKey, proof)

    if ('error' in result) {
      setError(result.error)
      setStep('form')
      return
    }

    // Account created — auto sign in
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (signInError) {
      setError('Cuenta creada. Hubo un problema al iniciar sesión — andá a Iniciar Sesión.')
      setStep('form')
      return
    }

    setStep('done')
    router.push('/panel')
  }

  return (
    <div className="w-full max-w-md">
      {/* Payment confirmed banner */}
      <div className="mb-5 rounded-2xl border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 p-4 flex items-center gap-3">
        <CheckCircle className="h-6 w-6 shrink-0 text-success-500" />
        <div>
          <p className="font-semibold text-success-800 dark:text-success-300 text-sm">
            ¡Pago confirmado!
          </p>
          <p className="text-xs text-success-700 dark:text-success-400">
            {planInfo.name} · {planInfo.period} · {planInfo.price}
          </p>
        </div>
      </div>

      {/* Registration card */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Último paso: creá tu cuenta
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tu suscripción quedará activa de inmediato
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="nombre_completo"
            value={formData.nombre_completo}
            onChange={handleChange}
            placeholder="Nombre completo *"
            autoComplete="name"
            required
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Correo electrónico *"
            autoComplete="email"
            required
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
          <input
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Teléfono *"
            autoComplete="tel"
            required
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
          <input
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Dirección (para envío de guía física) *"
            autoComplete="street-address"
            required
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
          <select
            name="oficio"
            value={formData.oficio}
            onChange={handleChange}
            required
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
          >
            <option value="">Oficio *</option>
            {OFICIOS_LISTA.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña (mín. 8 caracteres, 1 mayúscula, 1 número) *"
            autoComplete="new-password"
            required
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />

          {error && (
            <p className="rounded-xl bg-danger-500/10 dark:bg-danger-500/20 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={step === 'signing-in' || step === 'done'}
            className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {step === 'signing-in' ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Creando tu cuenta…</>
            ) : (
              <>Crear cuenta y acceder<ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
        ¿Ya tenés cuenta?{' '}
        <a href="/login" className="font-semibold text-primary-600 hover:underline">
          Iniciá sesión aquí
        </a>
      </p>
    </div>
  )
}

// ─── Root component ──────────────────────────────────────────────────────────
function SuccessPageInner() {
  const searchParams = useSearchParams()
  const planKey = (searchParams.get('plan') || 'basico') as PlanKey
  const sessionId = searchParams.get('session_id') || ''
  const isSimulated = searchParams.get('simulated') === 'true' || !sessionId

  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        setIsLoggedIn(!!user)
        setAuthChecked(true)
      })
  }, [])

  if (!authChecked) {
    return (
      <div className="flex items-center gap-2 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando…
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <ExistingUserActivation
        planKey={planKey}
        sessionId={sessionId}
        isSimulated={isSimulated}
      />
    )
  }

  return (
    <RegistrationForm
      planKey={planKey}
      sessionId={sessionId}
      isSimulated={isSimulated}
    />
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando…
          </div>
        }
      >
        <SuccessPageInner />
      </Suspense>
    </div>
  )
}
