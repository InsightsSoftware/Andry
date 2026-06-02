'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, Loader2, GraduationCap, User, X, ScrollText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { completePurchase } from '@/actions/complete-purchase'
import { activateExistingSubscription } from '@/actions/complete-purchase'
import { OFICIOS_LISTA } from '@/lib/validations'
import type { PlanKey } from '@/lib/stripe'

const PLAN_LABELS: Record<string, { name: string; period: string; price: string }> = {
  basico:  { name: 'Plan Básico',  period: '6 meses',  price: '$447' },
  premium: { name: 'Plan Premium', period: '12 meses', price: '$597' },
}

// ─── Terms & Conditions Modal ────────────────────────────────────────────────
function TermsModal({ onClose }: { onClose: () => void }) {
  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary-500" />
            <h2 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
              Términos de Servicio y Políticas de Privacidad
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex flex-col gap-5">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-center text-base">
            TÉRMINOS DE SERVICIO Y POLÍTICAS DE PRIVACIDAD DE Y EXAM PREP
          </p>
          <p>
            Bienvenido a Y Exam Prep. Al crear una cuenta en nuestra plataforma, el usuario
            (en adelante, &quot;el Estudiante&quot;) acepta de manera obligatoria, expresa e irrevocable los
            presentes Términos y Condiciones de Servicio. Si no está de acuerdo con alguna de estas
            cláusulas, no podrá registrarse ni acceder a nuestro ecosistema educativo.
          </p>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              1. LICENCIA DE USO PERSONAL E INTRANSFERIBLE
            </h3>
            <p>
              El acceso a la plataforma digital es una licencia única, de uso personal, individual e
              intransferible. Está estrictamente prohibido compartir, vender o prestar las credenciales
              de acceso (usuario y contraseña) a terceros, socios o trabajadores. El sistema cuenta con
              monitoreo geográfico y de direcciones IP. Si se detecta el uso simultáneo o inusual de una
              cuenta en diferentes dispositivos o ubicaciones, Y Exam Prep se reserva el derecho de
              suspender o cancelar la cuenta de inmediato, sin derecho a reclamo ni reembolso.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              2. PLANES DE ACCESO Y DURACIÓN
            </h3>
            <p className="mb-2">La plataforma opera bajo dos modalidades estrictas de tiempo:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                <span className="font-semibold">Plan Digital:</span> Otorga un acceso ininterrumpido al
                simulador y contenidos de estudio por un periodo fijo de seis (6) meses.
              </li>
              <li>
                <span className="font-semibold">Plan Premium:</span> Otorga un acceso ininterrumpido al
                simulador, contenidos de estudio y audios por un periodo fijo de doce (12) meses, e
                incluye la entrega de la guía de estudio en formato físico. Bajo ninguna circunstancia
                el acceso al material de estudio será ilimitado. Si el Estudiante no culmina su
                preparación dentro del tiempo contratado o requiere repetir el curso, deberá pagar el
                costo completo del plan nuevamente. Al finalizar su periodo de estudio, el Estudiante
                podrá optar por mantenerse activo exclusivamente en la red social/chat de la comunidad
                mediante el pago de una suscripción mensual fijada por la empresa, la cual no incluirá
                el acceso a los materiales de examen ni al simulador.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              3. PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR (COPYRIGHT)
            </h3>
            <p>
              Todo el contenido de este ecosistema —incluyendo el texto de las guías, el diseño visual,
              el banco de preguntas del simulador, las metodologías de enseñanza y los archivos de audio
              explicativos— es propiedad exclusiva de Y Exam Prep y está protegido por las leyes de
              derecho de autor federales e internacionales bajo el U.S. Copyright Act. Queda
              terminantemente prohibido descargar, extraer, grabar pantalla, copiar preguntas o
              distribuir cualquier material por vías físicas o digitales (como WhatsApp, Telegram o redes
              sociales). Cualquier infracción será procesada penalmente por la vía federal.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              4. USO CORRECTO DE LA RED SOCIAL INTERNA Y PROHIBICIÓN DE FILTRACIONES
            </h3>
            <p>
              La plataforma incluye un espacio interactivo para que los estudiantes compartan fotos de
              proyectos, presupuestos, estimados y consulten dudas académicas. No obstante, está
              estrictamente prohibido publicar, solicitar o difundir imágenes, capturas o textos de
              preguntas reales de los exámenes oficiales del estado de Florida administrados por Pearson
              VUE o el DBPR. El uso del chat para filtrar contenido oficial del estado causará la
              expulsión inmediata, el veto permanente de la plataforma y la notificación a las autoridades
              pertinentes por comportamiento deshonesto.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              5. MANUAL FÍSICO Y POLÍTICA DE ENVÍOS
            </h3>
            <p>
              La guía de estudio física está incluida exclusivamente en el Plan Premium (12 meses). El
              costo del envío estándar está cubierto dentro del precio del plan. Debido a que el acceso
              digital se otorga de manera inmediata al momento del pago, no se aceptan devoluciones del
              manual físico con fines de reembolso. En caso de que un envío sea devuelto a nuestras
              oficinas debido a un error del Estudiante al proporcionar su dirección postal, este deberá
              cubrir los costos de reenvío correspondientes.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              6. POLÍTICA DE REEMBOLSO ABSOLUTA
            </h3>
            <p>
              Debido a la naturaleza digital de nuestro producto y al acceso inmediato y completo a todo
              el ecosistema de estudio (simuladores, audios y manuales), TODAS LAS VENTAS SON FINALES. No
              se realizarán reembolsos, créditos ni cancelaciones parciales o totales bajo ninguna
              circunstancia una vez que el Estudiante haya procesado el pago y creado su cuenta en el
              sistema.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              7. EXENCIÓN DE RESPONSABILIDAD POR RESULTADOS OFICIALES
            </h3>
            <p>
              Y Exam Prep proporciona un entorno de entrenamiento técnico de alta calidad, pero no
              garantiza que el Estudiante apruebe los exámenes estatales de contratación de la Florida.
              El resultado exitoso en las pruebas oficiales depende exclusivamente de la disciplina, el
              tiempo invertido y la capacidad individual de cada alumno bajo la presión del examen real.
              La empresa no se hace responsable por pérdidas económicas, costos de reprogramación de
              citas ante Pearson VUE ni salarios perdidos debido a un resultado adverso.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              8. LIMITACIÓN DE RESPONSABILIDAD ECONÓMICA
            </h3>
            <p>
              En la máxima medida permitida por la legislación aplicable, la responsabilidad total de
              Y Exam Prep ante cualquier falla técnica en los servidores, interrupción temporal del
              servicio, error en las bases de datos o reclamación de cualquier índole, estará topada
              estrictamente al monto total neto que el Estudiante pagó por su plan de acceso. La empresa
              no asumirá costos por daños indirectos o de terceros.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              9. DESCARGO DE AFILIACIÓN OFICIAL (DISCLAIMER)
            </h3>
            <p>
              Y Exam Prep es una institución educativa privada independiente. No mantiene ninguna
              afiliación, endoso, patrocinio ni sociedad oficial con el Departamento de Regulación
              Profesional y de Negocios de Florida (DBPR), la junta de contratistas del estado, Pearson
              VUE, ni ningún otro organismo gubernamental regulador de licencias de construcción.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              10. JURISDICCIÓN Y LEY APLICABLE
            </h3>
            <p>
              Este acuerdo se regirá, interpretará y ejecutará estrictamente de acuerdo con las leyes del
              Estado de la Florida. En caso de cualquier disputa, desacuerdo o procedimiento legal
              relacionado con estos términos, las partes acuerdan someterse exclusivamente a la
              jurisdicción de las cortes locales del Condado de Volusia, Florida.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
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
    oficio: '',
  })
  const [oficioCustom, setOficioCustom] = useState('')
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!termsAccepted) {
      setError('Debés aceptar los Términos y Condiciones para continuar.')
      return
    }
    if (formData.oficio === 'Otro' && !oficioCustom.trim()) {
      setError('Por favor especificá tu tipo de licencia.')
      return
    }
    setError('')
    setStep('signing-in')

    const dataToSubmit = {
      ...formData,
      oficio: formData.oficio === 'Otro' ? oficioCustom.trim() : formData.oficio,
    }

    const proof = isSimulated
      ? ({ type: 'simulated' } as const)
      : ({ type: 'stripe', sessionId } as const)

    const result = await completePurchase(dataToSubmit, planKey, proof)

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
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

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
            {/* La dirección de envío ya la recolecta Stripe en el checkout del
                Plan Premium (estructurada y validada), por eso no se pide acá. */}
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

            {formData.oficio === 'Otro' && (
              <input
                type="text"
                placeholder="Especificá tu tipo de licencia *"
                value={oficioCustom}
                onChange={(e) => setOficioCustom(e.target.value)}
                required
                autoFocus
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            )}
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

            {/* Terms & Conditions checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group mt-1">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (e.target.checked) setError('')
                  }}
                  className="sr-only"
                />
                <div
                  className={`h-5 w-5 rounded-md border-2 transition-all duration-150 flex items-center justify-center ${
                    termsAccepted
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 group-hover:border-primary-400'
                  }`}
                >
                  {termsAccepted && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                >
                  Términos y Condiciones
                </button>
                {' '}de Y Exam Prep. Entiendo que la licencia es personal e intransferible y que todas las ventas son finales.
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-danger-500/10 dark:bg-danger-500/20 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={step === 'signing-in' || step === 'done' || !termsAccepted}
              className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
    </>
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
