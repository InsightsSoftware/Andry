import Link from 'next/link'
import { HeroLogo } from '@/components/ui/hero-logo'
import { HeroParallaxBg } from '@/components/ui/hero-parallax-bg'
import { ForYouSection } from '@/components/landing/for-you-section'
import {
  BookOpen,
  Headphones,
  Brain,
  Trophy,
  CheckCircle,
  ArrowRight,
  Shield,
  FileText,
  Video,
  HelpCircle,
  ChevronDown,
  Star,
  Hammer,
  Zap,
} from 'lucide-react'

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-20 sm:pb-28">
      {/* Parallax background layers */}
      <HeroParallaxBg />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* ── Large Centered Logo with 3D Tilt + Metallic Shine + Glow ── */}
        <HeroLogo />

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm text-neutral-600 dark:text-neutral-300">
          <Hammer className="h-4 w-4 text-accent-500 dark:text-accent-400" />
          Preparación de exámenes para contratistas en Florida
        </div>

        {/* Main headline */}
        <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl">
          Sabes construir, pero{' '}
          <span className="text-gold text-glow-gold">
            el examen es otro juego
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400 sm:text-xl leading-relaxed">
          La plataforma de estudio en español diseñada para contratistas hispanos.
          Audiolibros, PDF interactivo, banco de preguntas y asistente IA para
          que pases tu examen de licencia a la primera.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/precios"
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl btn-purple px-8 text-lg font-bold text-white transition-all duration-200 glow-purple sm:w-auto"
          >
            Comenzar Ahora
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/precios"
            className="flex min-h-[56px] w-full items-center justify-center rounded-xl px-8 text-lg font-semibold text-neutral-700 dark:text-neutral-300 glass glass-hover transition-all duration-200 sm:w-auto"
          >
            Ver Precios
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-success-500" />
            Pago único seguro
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-success-500" />
            30 días de garantía
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-accent-500 dark:text-accent-400" />
            100% en español
          </span>
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Los cursos tradicionales te cobran{' '}
          <span className="text-danger-500 dark:text-danger-400">$3,000+</span> y te dan fotocopias
        </h2>
        <p className="mx-auto mb-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
          Traducciones genéricas, videos de 20 minutos, copias textuales del
          libro. Pagaste caro y no aprendiste nada.
        </p>
        <p className="mx-auto mb-14 max-w-2xl text-lg font-semibold text-gold">
          Nosotros cambiamos eso.
        </p>
      </div>
    </section>
  )
}

function ServicesSection() {
  const services = [
    {
      icon: BookOpen,
      title: 'PDF Interactivo',
      desc: 'Guía de estudio de 350+ páginas con búsqueda, navegación por capítulos y tablas organizadas.',
      gradient: 'from-primary-600/12 to-primary-500/4',
      iconBg: 'bg-primary-500/10 border-primary-500/20',
      iconColor: 'text-primary-600 dark:text-primary-400',
    },
    {
      icon: Headphones,
      title: 'Audiolibros',
      desc: 'Estudia mientras trabajas o manejas. Cada módulo tiene su audiolibro narrado en español.',
      gradient: 'from-accent-500/10 to-accent-400/3',
      iconBg: 'bg-accent-500/10 border-accent-500/20',
      iconColor: 'text-accent-600 dark:text-accent-400',
    },
    {
      icon: Video,
      title: 'Videos Explicativos',
      desc: 'Lecciones en video que desglosan los temas más difíciles del examen con ejemplos claros.',
      gradient: 'from-emerald-500/10 to-emerald-400/3',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Brain,
      title: 'Asistente IA 24/7',
      desc: 'Pregúntale lo que sea sobre el examen. Te explica con ejemplos reales, disponible a toda hora.',
      gradient: 'from-violet-500/10 to-violet-400/3',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      icon: FileText,
      title: 'Banco de Preguntas',
      desc: 'Preguntas ilimitadas organizadas por capítulo. Cada una con explicación y referencia a la página del libro.',
      gradient: 'from-sky-500/10 to-sky-400/3',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      icon: Trophy,
      title: 'Simulacro de Examen',
      desc: 'Modo examen cronometrado que replica las condiciones reales. Practica hasta que estés listo.',
      gradient: 'from-amber-500/10 to-amber-400/3',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Todo lo que necesitas para{' '}
            <span className="text-primary-600 dark:text-primary-400">aprobar</span>
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Una plataforma completa diseñada para el contratista hispano en Florida
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((item) => (
            <div
              key={item.title}
              className="group relative rounded-2xl p-6 glass-card overflow-hidden transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              <div className="relative">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${item.iconBg}`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Regístrate',
      desc: 'Crea tu cuenta y elige tu plan. Un solo pago, sin suscripciones.',
    },
    {
      number: '02',
      title: 'Estudia a tu ritmo',
      desc: 'Accede al PDF, audiolibros y videos. Estudia cuando y donde quieras.',
    },
    {
      number: '03',
      title: 'Practica y domina',
      desc: 'Usa el banco de preguntas y simulacros. La IA te ayuda con tus dudas.',
    },
    {
      number: '04',
      title: 'Pasa tu examen',
      desc: 'Llega preparado y con confianza. Obtén tu licencia de contratista.',
    },
  ]

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            ¿Cómo funciona?
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">4 pasos para obtener tu licencia</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 border border-primary-500/20">
                <span className="text-lg font-bold text-gold">{step.number}</span>
              </div>
              <h3 className="mb-2 font-bold text-neutral-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingPreview() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Precios{' '}
            <span className="text-gold">transparentes</span>
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Un solo pago. Sin sorpresas ni suscripciones mensuales.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Basic */}
          <div className="rounded-2xl p-6 sm:p-8 glass-card">
            <h3 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Plan Básico</h3>
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Acceso digital completo</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">$299</span>
              <span className="ml-2 text-neutral-500 dark:text-neutral-400">/ 6 meses</span>
            </div>
            <ul className="mb-6 flex flex-col gap-2">
              {['PDF interactivo', 'Audiolibros', 'Banco de preguntas', 'Simulacro de examen', 'Asistente IA'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/precios"
              className="flex items-center justify-center gap-2 rounded-xl glass glass-hover px-6 py-3 text-sm font-semibold text-neutral-700 dark:text-white transition-all"
            >
              Elegir Plan Básico
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl p-6 sm:p-8 glass-card overflow-hidden border-primary-500/40 glow-purple">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent pointer-events-none" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-flex items-center gap-1 rounded-full btn-purple px-4 py-1 text-xs font-bold text-white">
                <Star className="h-3 w-3" />
                Más Popular
              </span>
            </div>
            <div className="relative">
              <h3 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Plan Premium</h3>
              <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Todo incluido + guía física</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">$599</span>
                <span className="ml-2 text-neutral-500 dark:text-neutral-400">/ 12 meses</span>
              </div>
              <ul className="mb-6 flex flex-col gap-2">
                {['Todo del Plan Básico', '12 meses de acceso', 'Guía física enviada a tu casa', 'Comunidad VIP', 'Soporte prioritario'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/precios"
                className="flex items-center justify-center gap-2 rounded-xl btn-purple px-6 py-3 text-sm font-bold text-white transition-all glow-purple"
              >
                Elegir Plan Premium
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const faqs = [
    {
      q: '¿En qué idioma está el material?',
      a: 'Todo el contenido está 100% en español — la guía de estudio, los audiolibros, los videos y el asistente IA.',
    },
    {
      q: '¿Qué exámenes cubre la plataforma?',
      a: 'Actualmente cubrimos el examen de Negocios y Finanzas para licencia de contratista en Florida. Próximamente más módulos.',
    },
    {
      q: '¿Es un pago único o suscripción?',
      a: 'Es un pago único. No hay cargos mensuales ni renovaciones automáticas. Pagas una vez y tienes acceso durante 6 o 12 meses según tu plan.',
    },
    {
      q: '¿Puedo estudiar desde mi teléfono?',
      a: 'Sí, la plataforma es 100% mobile-first. Funciona perfectamente en tu teléfono, tablet o computadora.',
    },
    {
      q: '¿Qué pasa si no paso el examen?',
      a: 'Tienes 30 días de garantía desde tu compra. Si no estás satisfecho con la plataforma, te devolvemos tu dinero.',
    },
    {
      q: '¿Cómo funciona el asistente IA?',
      a: 'Es un tutor inteligente entrenado con el material del examen. Le puedes preguntar cualquier duda y te responde al instante, las 24 horas.',
    },
  ]

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl glass-card overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-5 text-left font-semibold text-neutral-900 dark:text-white list-none">
                <span className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown className="h-5 w-5 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 pl-13 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="px-4 py-20">
      <div className="relative mx-auto max-w-2xl rounded-2xl p-8 sm:p-12 text-center overflow-hidden glass-card glow-purple-strong">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 to-accent-500/5 pointer-events-none" />
        <div className="relative">
          <Zap className="mx-auto mb-4 h-10 w-10 text-accent-500 dark:text-accent-400" />
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Empieza a estudiar hoy
          </h2>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400">
            No pierdas más tiempo con métodos obsoletos. Únete a la plataforma
            que realmente te prepara para pasar el examen.
          </p>
          <Link
            href="/registro"
            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl btn-purple px-8 text-lg font-bold text-white transition-all duration-200 glow-purple"
          >
            Crear Mi Cuenta Gratis
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-neutral-500">
            Registro gratuito — elige tu plan después
          </p>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ForYouSection />
      <ProblemSection />
      <ServicesSection />
      <HowItWorksSection />
      <PricingPreview />
      <FAQSection />
      <CTASection />
    </>
  )
}
