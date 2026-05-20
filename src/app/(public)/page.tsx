import Link from 'next/link'
import { HeroLogo } from '@/components/ui/hero-logo'
import { HeroParallaxBg } from '@/components/ui/hero-parallax-bg'
import { ForYouSection } from '@/components/landing/for-you-section'
import { Spotlight } from '@/components/ui/spotlight'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import {
  BookOpen,
  Headphones,
  Trophy,
  CheckCircle,
  ArrowRight,
  Shield,
  FileText,
  HelpCircle,
  ChevronDown,
  Star,
  Hammer,
  Users,
  Zap,
  BadgeCheck,
  TrendingUp,
  Landmark,
} from 'lucide-react'

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-20 sm:pb-28">
      <HeroParallaxBg />

      <Spotlight
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(270, 80%, 70%, .14) 0, hsla(270, 80%, 55%, .05) 50%, hsla(270, 80%, 45%, 0) 80%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(270, 80%, 70%, .10) 0, hsla(270, 80%, 55%, .03) 80%, transparent 100%)"
        gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(43, 70%, 65%, .09) 0, hsla(43, 70%, 50%, .02) 80%, transparent 100%)"
        translateY={-300}
        duration={9}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <HeroLogo />

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm text-neutral-600 dark:text-neutral-300">
          <Hammer className="h-4 w-4 text-accent-500 dark:text-accent-400" />
          Preparación de exámenes para contratistas en Florida
        </div>

        {/* Headline — matching old landing */}
        <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl">
          Domina el Examen y Obtén tu{' '}
          <br className="hidden sm:block" />
          <span className="text-gold text-glow-gold">Licencia de Contratista</span>{' '}
          en Florida
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400 sm:text-xl leading-relaxed">
          La plataforma de estudio en español diseñada para contratistas hispanos.
          Audiolibros, PDF interactivo, banco de preguntas y comunidad para
          que pases tu examen de licencia a la primera.
        </p>

        {/* VSL — Video de Ventas Principal */}
        <div className="mx-auto mb-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl shadow-primary-900/30 aspect-video flex items-center justify-center">
          <p className="text-neutral-400 text-sm">Video de demostración próximamente</p>
        </div>

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
            Soporte 24/7
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

function FeatureBadgesSection() {
  const badges = [
    {
      icon: BadgeCheck,
      label: 'Licencia Oficial',
      desc: 'Preparación validada para el examen de contratista del estado de Florida.',
      color: 'text-primary-400',
      border: 'border-primary-500/30',
      bg: 'from-primary-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Más Ingresos',
      desc: 'Con tu licencia podés cobrar más, aceptar contratos grandes y crecer.',
      color: 'text-accent-400',
      border: 'border-accent-500/30',
      bg: 'from-accent-500/10',
    },
    {
      icon: Landmark,
      label: 'Pagos en Legal',
      desc: 'Trabajá con contratos formales, protegé tus pagos y operá con seguridad.',
      color: 'text-success-400',
      border: 'border-success-500/30',
      bg: 'from-success-500/10',
    },
  ]

  return (
    <section className="px-4 pb-16">
      <div className="mx-auto max-w-5xl grid gap-4 sm:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.label}
            className={`group rounded-2xl border ${b.border} bg-gradient-to-br ${b.bg} to-transparent p-6 glass-card transition-all duration-300 hover:-translate-y-0.5`}
          >
            <b.icon className={`mb-3 h-7 w-7 ${b.color}`} />
            <h3 className="mb-1 font-bold text-neutral-900 dark:text-white">{b.label}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProblemSection() {
  const bullets = [
    'Estudiá la guía oficial con ejemplos claros y en español',
    'Escuchá los audiolibros mientras manejás o trabajás',
    'Practicá con preguntas reales del examen por capítulo',
    'Consulta a Contratistas Certificados en nuestro foro de Comunidad 24/7.',
    'Simulá el examen real con cronómetro y condiciones idénticas',
    'Aprendé al ritmo que tu jornada de trabajo te permite',
    'Chocas con la barrera del idioma y con cursos que solo ofrecen malas traducciones.',
    'Caes en las trampas del Estado: el examen evalúa tu velocidad para interpretar leyes bajo presión, no tus años de experiencia.',
  ]

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Text side */}
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
              El problema real
            </p>
            <h2 className="mb-6 text-3xl font-extrabold leading-tight text-neutral-900 dark:text-white sm:text-4xl">
              Sabés construir...{' '}
              <span className="text-gold">pero el examen es otro juego.</span>
            </h2>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Tenés años de oficio en las manos. Instalás, cablear, inspeccionás mejor que nadie.
              Lo que te tiene frenado no es el trabajo — es el papel. El examen de contratista
              tiene sus propias reglas, y sin la preparación correcta, podés darlo varias veces
              sin pasar.
            </p>

            <ul className="mb-8 flex flex-col gap-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href="/precios"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl btn-purple px-8 text-base font-bold text-white transition-all duration-200 glow-purple"
            >
              Comenzar Ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Image side */}
          <div className="relative h-80 overflow-hidden rounded-2xl shadow-2xl shadow-primary-900/20 lg:h-[460px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1503387837-b154d5074bd2?auto=format&fit=crop&w=800&q=80"
              alt="Contratista estudiando el material del examen"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesRowSection() {
  const features = [
    {
      icon: Star,
      title: '100% en Español',
      desc: 'Contenido diseñado para quienes piensan, trabajan y aprenden en español.',
      color: 'text-accent-400',
    },
    {
      icon: Headphones,
      title: 'Estudia en Movimiento',
      desc: 'Escuchá audiolibros y aprendé sin detener tu vida ni tu jornada de trabajo.',
      color: 'text-sky-400',
    },
    {
      icon: FileText,
      title: 'Buscador Inteligente de PDFs',
      desc: 'Encontrá cualquier ley, artículo o concepto en segundos dentro de los libros oficiales.',
      color: 'text-primary-400',
    },
    {
      icon: Users,
      title: 'Comunidad Exclusiva',
      desc: 'Un espacio donde otros contratistas te apoyan, comparten trabajo y te acompañan.',
      color: 'text-success-400',
    },
  ]

  return (
    <section className="px-4 py-20 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
            La diferencia
          </p>
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            En Y Exam Prep no solo estudias.{' '}
            <span className="text-gold">Te entrenas para el juego.</span>
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Cuatro razones que nos hacen distintos.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="text-center glass-card rounded-2xl p-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10">
                <f.icon className={`h-7 w-7 ${f.color}`} />
              </div>
              <h3 className="mb-2 font-bold text-neutral-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/precios"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl btn-purple px-8 text-base font-bold text-white transition-all duration-200 glow-purple"
          >
            Comenzar Ahora
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}


function ForWhoSection() {
  const bullets = [
    'Preparás para tu primera licencia de contratista en Florida',
    'Tenés el oficio pero no el tiempo para estudiar con métodos tradicionales',
    'Has intentado pasar el examen y necesitás apoyo real en español',
    'Querés dejar de depender de otros y trabajar con contratos propios',
    'Buscás crecer, cobrar mejor y operar de forma completamente legal',
    'Necesitás una herramienta que se adapte a tu ritmo de trabajo diario',
  ]

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
            ¿Es para mí?
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Este Programa es para ti si...
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {bullets.map((b) => (
            <div
              key={b}
              className="flex items-start gap-3 rounded-xl glass-card p-4"
            >
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success-500" />
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ServicesSection() {
  const services = [
    {
      icon: BookOpen,
      title: 'Guía de Estudio y PDF Interactivo',
      desc: 'Guía oficial de 350+ páginas con búsqueda, navegación por capítulos y audiolibros narrados en español. Estudia desde tu teléfono, donde sea.',
      gradient: 'from-primary-600/12 to-primary-500/4',
      iconBg: 'bg-primary-500/10 border-primary-500/20',
      iconColor: 'text-primary-400',
      badge: null,
    },
    {
      icon: Trophy,
      title: 'Entrenamiento con Preguntas Reales',
      desc: 'Banco de preguntas ilimitadas organizadas por capítulo con explicaciones. Simulacro de examen cronometrado idéntico al real. La herramienta más efectiva para pasar.',
      gradient: 'from-accent-500/10 to-accent-400/3',
      iconBg: 'bg-accent-500/10 border-accent-500/20',
      iconColor: 'text-accent-400',
      badge: 'Lo más buscado',
    },
    {
      icon: Users,
      title: 'Comunidad + Apoyo Completo',
      desc: 'Comunidad exclusiva de contratistas hispanos. Foro 24/7 con Contratistas Certificados para resolver dudas. Videos explicativos para los temas más difíciles.',
      gradient: 'from-success-500/10 to-success-400/3',
      iconBg: 'bg-success-500/10 border-success-500/20',
      iconColor: 'text-success-400',
      badge: null,
    },
    {
      icon: Hammer,
      title: 'Red de Aliados Comerciales',
      desc: 'Accedé a proveedores, subcontratistas y socios de confianza dentro de la comunidad. Conectate con quienes hacen crecer tu negocio.',
      gradient: 'from-accent-500/8 to-primary-500/4',
      iconBg: 'bg-accent-500/10 border-accent-500/20',
      iconColor: 'text-accent-400',
      badge: 'Nuevo',
    },
  ]

  return (
    <section className="px-4 py-20 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
            Qué incluye
          </p>
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Nuestros Servicios
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Una plataforma completa diseñada para el contratista hispano en Florida
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item) => (
            <div
              key={item.title}
              className="group relative rounded-2xl p-6 glass-card overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
            >
              {item.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-accent-500/20 border border-accent-500/30 px-3 py-0.5 text-xs font-bold text-accent-400">
                  {item.badge}
                </span>
              )}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              <div className="relative">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${item.iconBg}`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white pr-16">
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

function CTABannerSection() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-3xl rounded-2xl glass-card glow-purple-strong overflow-hidden">
        <div className="relative p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 to-accent-500/5 pointer-events-none" />
          <div className="relative">
            <h2 className="mb-3 text-2xl font-extrabold text-neutral-900 dark:text-white sm:text-3xl">
              Obtén Tu Licencia Ahora
            </h2>
            <p className="mb-8 text-neutral-600 dark:text-neutral-400">
              Únete a la plataforma que realmente te prepara.
              Un solo pago, sin suscripciones.
            </p>
            <Link
              href="/precios"
              className="inline-flex min-h-[56px] items-center gap-2 rounded-xl btn-purple px-10 text-lg font-bold text-white transition-all duration-200 glow-purple"
            >
              Comenzar Ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: 'Estudié con los audiolibros mientras manejaba a la obra. Pasé el examen al primer intento.',
      name: 'Carlos M.',
      title: 'Electricista — Miami, FL',
    },
    {
      quote: 'Todo en español, sin traducciones raras. Por fin un material que habla como nosotros.',
      name: 'Roberto G.',
      title: 'Plomero — Orlando, FL',
    },
    {
      quote: 'El asistente IA me explicó lo de los gravámenes 10 veces sin cansarse. Increíble.',
      name: 'Miguel A.',
      title: 'Contratista General — Tampa, FL',
    },
    {
      quote: 'Pagué $3,000 en otro curso y no aprendí nada. Con Y Exam Prep lo logré en 2 meses.',
      name: 'José R.',
      title: 'HVAC — Fort Lauderdale, FL',
    },
    {
      quote: 'El PDF interactivo con búsqueda me salvó la vida. Nada de andar hojeando páginas.',
      name: 'Luis H.',
      title: 'Albañil — Jacksonville, FL',
    },
    {
      quote: 'Los simulacros de examen son exactamente como el real. Me fue mucho mejor de lo que esperaba.',
      name: 'Andrés P.',
      title: 'Carpintero — Hialeah, FL',
    },
  ]

  return (
    <section className="py-16 overflow-hidden">
      <div className="mb-10 text-center px-4">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
          Testimonios
        </p>
        <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Que Dicen Nuestros{' '}
          <span className="text-primary-600 dark:text-primary-400">Clientes</span>
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Historias reales de contratistas hispanos que ya pasaron su examen
        </p>
      </div>
      <InfiniteMovingCards
        items={testimonials}
        direction="left"
        speed="slow"
        pauseOnHover
      />
    </section>
  )
}

function FAQSection() {
  const faqs = [
    {
      q: '¿Necesito tener mi compañía abierta para empezar a estudiar?',
      a: 'No. Podés estudiar y prepararte sin necesidad de tener tu empresa constituida. La plataforma está diseñada para que arranques desde cero y llegues al examen listo.',
    },
    {
      q: '¿El precio incluye los libros oficiales del Estado?',
      a: 'Sí. El contenido de la plataforma está basado en los libros oficiales del DBPR de Florida. Incluye la guía digital interactiva, audiolibros y banco de preguntas — todo en español.',
    },
    {
      q: '¿Es compatible con mi celular o solo computadora?',
      a: 'La plataforma es 100% mobile-first. Funciona perfectamente en tu teléfono, tablet o computadora — sin necesidad de instalar nada.',
    },
    {
      q: '¿En qué idioma está el material?',
      a: 'Todo el contenido está 100% en español — la guía de estudio, los audiolibros, los videos y el asistente IA.',
    },
    {
      q: '¿Cuánto tiempo tengo acceso a la plataforma?',
      a: 'El Plan Básico incluye 6 meses de acceso. El Plan Premium incluye 12 meses. Sin renovaciones automáticas.',
    },
    {
      q: '¿Puedo llevar más de un libro de texto?',
      a: 'Actualmente cubrimos el examen de Negocios y Finanzas para la licencia de contratista en Florida. Más módulos próximamente.',
    },
    {
      q: '¿Puedo llevar más de un examen del estado?',
      a: 'La preparación actual está enfocada en el examen de Negocios y Finanzas del DBPR de Florida.',
    },
  ]

  return (
    <section className="px-4 py-20 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
            Dudas comunes
          </p>
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Preguntas Frecuentes
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

function PricingSection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
            Inversión
          </p>
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
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-neutral-500">Plan Básico</p>
            <h3 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Digital Orga</h3>
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Acceso digital completo</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">$447</span>
              <span className="ml-2 text-neutral-500 dark:text-neutral-400">/ 6 meses</span>
            </div>
            <ul className="mb-6 flex flex-col gap-2">
              {['PDF interactivo', 'Audiolibros', 'Banco de preguntas', 'Simulacro de examen', 'Acceso a la comunidad de contratistas', 'Red de Aliados Comerciales'].map((f) => (
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
          <div className="relative rounded-2xl p-6 sm:p-8 glass-card border-primary-500/40 glow-purple">
            {/* Gradient clipped separately so overflow-hidden doesn't cut the badge */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full btn-purple px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary-600/30">
                <Star className="h-3 w-3 fill-current" />
                Más Popular
              </span>
            </div>
            <div className="relative">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-neutral-500">Plan Premium</p>
              <h3 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Todo Incluido</h3>
              <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Digital + guía física en casa</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">$597</span>
                <span className="ml-2 text-neutral-500 dark:text-neutral-400">/ 12 meses</span>
              </div>
              <ul className="mb-6 flex flex-col gap-2">
                {['Todo del Plan Básico', '12 meses de acceso', 'Guía física enviada a tu casa', 'Comunidad VIP de contratistas', 'Red de Aliados Comerciales', 'Soporte prioritario'].map((f) => (
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

function FinalCTASection() {
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
            href="/precios"
            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl btn-purple px-8 text-lg font-bold text-white transition-all duration-200 glow-purple"
          >
            Comenzar Ahora
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-neutral-500">
            Un solo pago — sin suscripciones
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
      <FeatureBadgesSection />
      <ForYouSection />
      <ProblemSection />
      <FeaturesRowSection />

      <ForWhoSection />
      <ServicesSection />
      <CTABannerSection />
      <TestimonialsSection />
      <FAQSection />
      <PricingSection />
      <FinalCTASection />
    </>
  )
}
