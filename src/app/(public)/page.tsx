import Link from 'next/link'
import { HeroParallaxBg } from '@/components/ui/hero-parallax-bg'
import { CheckoutButton } from '@/components/landing/checkout-button'
import { ForYouSection } from '@/components/landing/for-you-section'
import { CuposAgotadosBtn } from '@/components/landing/cupos-agotados-btn'
import { Spotlight } from '@/components/ui/spotlight'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import { cuposAgotados as checkCuposAgotados } from '@/lib/cupos'
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

// La landing cuenta los cupos en vivo (cap de ventas). Sin esto, Next
// prerenderiza la página estática y el conteo queda congelado del build,
// así que el bloqueo nunca se activa aunque ya se haya llegado al límite.
export const dynamic = 'force-dynamic'

// VSL (video de ventas corregido) — asset público en Supabase Storage, bucket 'marketing'.
const VSL_VIDEO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marketing/vsl-corregido.mp4`

function HeroSection({ cuposAgotados }: { cuposAgotados: boolean }) {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-20 sm:pt-28 sm:pb-28">
      <HeroParallaxBg />

      <Spotlight
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(270, 80%, 70%, .14) 0, hsla(270, 80%, 55%, .05) 50%, hsla(270, 80%, 45%, 0) 80%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(270, 80%, 70%, .10) 0, hsla(270, 80%, 55%, .03) 80%, transparent 100%)"
        gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(43, 70%, 65%, .09) 0, hsla(43, 70%, 50%, .02) 80%, transparent 100%)"
        translateY={-300}
        duration={9}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm text-neutral-600 dark:text-neutral-300">
          <Hammer className="h-4 w-4 text-accent-500 dark:text-accent-400" />
          Preparación de exámenes para contratistas en Florida
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] tracking-tight text-neutral-900 dark:text-white sm:text-6xl lg:text-7xl">
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
        <div className="mx-auto mb-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl shadow-primary-900/30 aspect-video">
          <video
            src={VSL_VIDEO_URL}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {cuposAgotados ? (
            <CuposAgotadosBtn />
          ) : (
            <>
              <a
                href="#precios"
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl btn-purple px-8 text-lg font-bold text-white transition-all duration-200 glow-purple sm:w-auto"
              >
                Comenzar Ahora
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#precios"
                className="flex min-h-[56px] w-full items-center justify-center rounded-xl px-8 text-lg font-semibold text-neutral-700 dark:text-neutral-300 glass glass-hover transition-all duration-200 sm:w-auto"
              >
                Ver Precios
              </a>
            </>
          )}
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
      desc: 'Ya tienes años trabajando en construcción. Ahora es momento de respaldar tu conocimiento con una licencia estatal que te abra más puertas y te dé reconocimiento profesional en Florida.',
      color: 'text-primary-400',
      border: 'border-primary-500/30',
      bg: 'from-primary-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Más Ingresos',
      desc: 'Los contratistas licenciados acceden a proyectos más grandes, mejores contratos y mayores oportunidades. Obtener tu licencia no es un gasto, es una inversión directa en tu crecimiento económico.',
      color: 'text-accent-400',
      border: 'border-accent-500/30',
      bg: 'from-accent-500/10',
    },
    {
      icon: Landmark,
      label: 'Negocio Legal',
      desc: 'Trabaja con seguridad, formalidad y confianza. Una licencia oficial te permite operar legalmente, ganar credibilidad y escalar tu empresa sin límites.',
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

function ProblemSection({ cuposAgotados }: { cuposAgotados: boolean }) {
  const bullets = [
    'Te enfrentas a miles de páginas técnicas y manuales extensos imposibles de memorizar.',
    'Chocas con la barrera del idioma y con cursos que solo ofrecen malas traducciones.',
    'Llegas agotado después del trabajo, sin tiempo ni energía para sentarte a leer.',
    'Caes en las "trampas" del Estado: el examen evalúa tu velocidad para interpretar leyes y códigos bajo presión, no tus años de experiencia en la obra.',
    'Tienen miedo de reprobar y perder miles de dólares en escuelas tradicionales.',
  ]

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Text side */}
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
              El problema
            </p>
            <h2 className="mb-6 text-3xl font-extrabold leading-tight sm:text-4xl">
              <span className="text-primary-600 dark:text-primary-400">Sabes construir...</span>
              <br />
              <span className="text-neutral-900 dark:text-white">pero el examen es otro juego.</span>
            </h2>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Muchos profesionales de la construcción en Florida tienen años de experiencia en el campo,
              pero cuando llega el momento de presentar el examen de licencia:
            </p>

            <ul className="mb-6 flex flex-col gap-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                  {b}
                </li>
              ))}
            </ul>

            <p className="mb-8 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              El problema no es tu capacidad.<br />
              El problema es no tener una preparación estratégica.
            </p>

            {cuposAgotados ? (
              <CuposAgotadosBtn />
            ) : (
              <a
                href="#precios"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl btn-purple px-8 text-base font-bold text-white transition-all duration-200 glow-purple"
              >
                Comenzar Ahora
                <ArrowRight className="h-5 w-5" />
              </a>
            )}
          </div>

          {/* Image side */}
          <div className="relative h-80 overflow-hidden rounded-2xl shadow-2xl shadow-primary-900/20 lg:h-[460px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/contractor-problem.jpg"
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
      desc: 'Escucha audiolibros y memoriza los conceptos importantes sin detener tu vida ni tu jornada de trabajo.',
      color: 'text-sky-400',
    },
    {
      icon: FileText,
      title: 'Buscador Inteligente de PDFs',
      desc: 'Encuentra cualquier ley, artículo o concepto clave en segundos.',
      color: 'text-primary-400',
    },
    {
      icon: Users,
      title: 'Comunidad Exclusiva',
      desc: 'Un espacio donde otros contratistas te apoyan, comparten experiencias y te acompañan en el proceso.',
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
            <span className="text-gold">Te entrenas para ganar.</span>
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
          <a
            href="#precios"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl btn-purple px-8 text-base font-bold text-white transition-all duration-200 glow-purple"
          >
            Comenzar Ahora
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  )
}


function ForWhoSection() {
  const bullets = [
    'Te preparas para obtener tu primera licencia de contratista en Florida y quieres formalizar tu carrera.',
    'Tienes la experiencia en la obra, pero los métodos de estudio tradicionales no se adaptan a tu ritmo de trabajo diario.',
    'Has intentado aprobar el examen antes y buscas una preparación estratégica con apoyo real, 100% en español.',
    'Eres subcontratista y estás listo para dar el salto, trabajar con tus propios contratos y dejar de depender de otros.',
    'Buscas aumentar tus ingresos, cobrar lo justo por tu experiencia y acceder a proyectos de mayor nivel.',
    'Tienes tu propio negocio y deseas operar de forma completamente legal para ganar mayor credibilidad en el mercado.',
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
      title: 'Guía, audios y PDF Interactivo',
      desc: 'Guía visual de más de 350 páginas con motor de búsqueda, navegación por capítulos y audiolibros narrados en español. Repasa desde tu teléfono en cualquier lugar.',
      gradient: 'from-primary-600/12 to-primary-500/4',
      iconBg: 'bg-primary-500/10 border-primary-500/20',
      iconColor: 'text-primary-400',
      badge: null,
    },
    {
      icon: Trophy,
      title: 'Entrenamiento en el Simulador',
      desc: 'Extenso banco de preguntas prácticas, organizadas por capítulo y con sus explicaciones. Simulador de examen cronometrado para recrear las condiciones de la prueba real. Una herramienta clave para tu preparación.',
      gradient: 'from-accent-500/10 to-accent-400/3',
      iconBg: 'bg-accent-500/10 border-accent-500/20',
      iconColor: 'text-accent-400',
      badge: 'Lo más buscado',
    },
    {
      icon: Users,
      title: 'Comunidad + Apoyo',
      desc: 'Un espacio de colaboración entre contratistas. Intercambia dudas de estudio, soluciones para el trabajo diario y accede a un foro activo donde puedes publicar proyectos, subcontratar o encontrar nuevas oportunidades laborales.',
      gradient: 'from-success-500/10 to-success-400/3',
      iconBg: 'bg-success-500/10 border-success-500/20',
      iconColor: 'text-success-400',
      badge: null,
    },
    {
      icon: Hammer,
      title: 'Red de Aliados Comerciales',
      desc: 'Accede a empresas proveedoras de servicios y socios de confianza dentro de nuestra red para que escales tu negocio.',
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

function CTABannerSection({ cuposAgotados }: { cuposAgotados: boolean }) {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-3xl rounded-2xl glass-card glow-purple-strong overflow-hidden">
        <div className="relative p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 to-accent-500/5 pointer-events-none" />
          <div className="relative">
            <h2 className="mb-3 text-2xl font-extrabold text-neutral-900 dark:text-white sm:text-3xl">
              Prepárate para tu licencia de contratista
            </h2>
            <p className="mb-8 text-neutral-600 dark:text-neutral-400">
              Únete a la plataforma que realmente te prepara.
            </p>
            {cuposAgotados ? (
              <CuposAgotadosBtn />
            ) : (
              <a
                href="#precios"
                className="inline-flex min-h-[56px] items-center gap-2 rounded-xl btn-purple px-10 text-lg font-bold text-white transition-all duration-200 glow-purple"
              >
                Comenzar mi preparación
                <ArrowRight className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: 'El paquete con la guía física me llegó súper rápido. La calidad de impresión es excelente y el contenido va directo al grano, sin rodeos.',
      name: 'Carlos M.',
      title: 'Electricista — Miami, FL',
    },
    {
      quote: 'Los audiolibros son mi salvación. Ahora aprovecho para repasar los capítulos mientras manejo la van de una obra a otra. Cero tiempo perdido.',
      name: 'Roberto G.',
      title: 'Plomero — Orlando, FL',
    },
    {
      quote: 'Llevo un par de semanas con el simulador y me está ayudando muchísimo a controlar la presión del reloj. Siento que por fin entiendo cómo es la dinámica de la prueba.',
      name: 'Luis H.',
      title: 'Contratista General — Tampa, FL',
    },
    {
      quote: 'Por fin un material que está en un español claro y profesional. Nada de esas traducciones de internet que al final te confunden más con los términos técnicos.',
      name: 'Miguel A.',
      title: 'HVAC — Jacksonville, FL',
    },
    {
      quote: 'Se nota desde el día uno que esta plataforma la diseñó alguien que sabe lo que es estar en el campo de trabajo. Todo es muy práctico y enfocado a nuestra realidad.',
      name: 'Javier R.',
      title: 'Albañil — Fort Lauderdale, FL',
    },
    {
      quote: 'Me gusta mucho cómo te enseñan a buscar rápido en los libros oficiales en lugar de obligarte a leer 500 páginas. Te ayudan a memorizar solo lo verdaderamente importante.',
      name: 'Andrés P.',
      title: 'Carpintero — Hialeah, FL',
    },
    {
      quote: 'La parte de Negocios y Finanzas siempre me dio dolores de cabeza, pero aquí lo explican paso a paso. Hace que los números y las leyes sean mucho menos intimidantes.',
      name: 'Oscar T.',
      title: 'Roofing — Sarasota, FL',
    },
    {
      quote: 'Entrar al foro y ver a otros contratistas compartiendo cómo estudian te motiva a no aflojarle después de una jornada dura de trabajo. Muy buen ambiente.',
      name: 'Fernando S.',
      title: 'Pintor — Naples, FL',
    },
    {
      quote: 'Aprovecho mi break del almuerzo en la obra para hacer pruebas cortas en el celular. La plataforma carga rapidísimo y es súper fácil de usar desde el teléfono.',
      name: 'Rubén C.',
      title: 'Contratista General — Tallahassee, FL',
    },
    {
      quote: 'Soy una persona muy visual, así que la manera en que está organizada la guía con gráficos y ejemplos hace que el manual sea mucho más fácil de digerir.',
      name: 'Héctor L.',
      title: 'Plomero — Cape Coral, FL',
    },
    {
      quote: 'Había gastado dinero en otros métodos antes y me frustré rápido. Este ecosistema es completamente diferente, se siente premium y de verdad te acompaña en el proceso.',
      name: 'Diego F.',
      title: 'Electricista — West Palm Beach, FL',
    },
  ]

  return (
    <section className="py-16 overflow-hidden">
      <div className="mb-10 text-center px-4">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
          Testimonios
        </p>
        <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Lo Que Dicen Nuestros{' '}
          <span className="text-primary-600 dark:text-primary-400">Contratistas</span>
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Historias reales de profesionales que ya comenzaron su entrenamiento con nosotros
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
      a: 'No. Puedes empezar a prepararte y aprobar tu examen de Negocios y Finanzas mientras organizas los trámites de tu corporación. ¡Adelantar tu estudio ahora te ahorrará meses de espera después!',
    },
    {
      q: '¿El precio incluye los libros oficiales del Estado?',
      a: 'No. El Estado de Florida exige que utilices sus libros originales de referencia. Lo que nosotros te entregamos es un Sistema de Estudio Inteligente (Guía visual, audiolibros y simuladores) creado específicamente para que entiendas, domines y sepas navegar esos libros oficiales.',
    },
    {
      q: '¿Puedo llevar la Guía de Estudio de Y Exam Prep el día de mi examen oficial?',
      a: 'No. Nuestra Guía de Estudio y nuestros materiales son herramientas de preparación diseñadas para que entrenes en casa o en el trabajo. El día de tu examen oficial, debes presentarte únicamente con los libros de referencia aprobados por el Estado.',
    },
    {
      q: '¿Cuánto tiempo tengo acceso a la plataforma?',
      a: 'Tienes acceso completo a los audiolibros, simuladores y actualizaciones mientras esté activa tu membresía, según el plan que hayas escogido. Si al vencerse tu plan necesitas más tiempo para presentar tu examen, podrás mantener tu cuenta activa mediante una mensualidad.',
    },
    {
      q: '¿Cuándo recibo mis guías físicas?',
      a: 'Tu acceso a la plataforma digital y a los audiolibros es inmediato al momento del pago. Tus manuales físicos impresos se envían por correo y los recibirás directamente en la puerta de tu casa en pocos días.',
    },
    {
      q: '¿Es compatible con mi celular o necesito una computadora?',
      a: 'La plataforma está diseñada pensando en el profesional que está en movimiento. Funciona perfectamente en tu teléfono, tableta o computadora sin necesidad de instalar nada extra.',
    },
    {
      q: '¿Para qué examen me prepara este programa exactamente?',
      a: 'Nuestro programa actual está enfocado en prepararte estratégicamente para el examen de Negocios y Finanzas (Business and Finance) del DBPR de Florida, el cual es un requisito indispensable para los contratistas.',
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

function PricingSection({ cuposAgotados }: { cuposAgotados: boolean }) {
  return (
    <section id="precios" className="px-4 py-20 scroll-mt-16">
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
            Acceso claro y sin sorpresas.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Basic */}
          <div className="rounded-2xl p-6 sm:p-8 glass-card">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-neutral-500">Plan Básico</p>
            <h3 className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">Digital</h3>
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Acceso digital completo</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">$447</span>
              <span className="ml-2 text-neutral-500 dark:text-neutral-400">/ 6 meses</span>
            </div>
            <ul className="mb-6 flex flex-col gap-2">
              {['Guía visual digital', 'Audiolibros', 'Simulador de examen', 'Acceso a la comunidad de contratistas', 'Red de aliados comerciales', '6 meses de acceso'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {cuposAgotados ? (
              <CuposAgotadosBtn />
            ) : (
              <CheckoutButton
                planKey="basico"
                label="Elegir Plan Básico"
                className="w-full glass glass-hover text-neutral-700 dark:text-white"
              />
            )}
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
                {['Guía visual digital', 'Audiolibros', 'Simulador de examen', 'Acceso a la comunidad de contratistas', 'Red de aliados comerciales', '12 meses de acceso', 'Guía física enviada a tu casa'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <CheckCircle className="h-4 w-4 text-success-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {cuposAgotados ? (
                <CuposAgotadosBtn />
              ) : (
                <CheckoutButton
                  planKey="premium"
                  label="Elegir Plan Premium"
                  className="w-full btn-purple text-white glow-purple"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCTASection({ cuposAgotados }: { cuposAgotados: boolean }) {
  return (
    <section className="px-4 py-20">
      <div className="relative mx-auto max-w-2xl rounded-2xl p-8 sm:p-12 text-center overflow-hidden glass-card glow-purple-strong">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 to-accent-500/5 pointer-events-none" />
        <div className="relative">
          <Zap className="mx-auto mb-4 h-10 w-10 text-accent-500 dark:text-accent-400" />
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Empieza tu entrenamiento hoy
          </h2>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400">
            No pierdas más tiempo con métodos obsoletos. Únete a la plataforma
            que realmente te prepara para pasar el examen.
          </p>
          {cuposAgotados ? (
            <CuposAgotadosBtn className="mt-2" />
          ) : (
            <>
              <a
                href="#precios"
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl btn-purple px-8 text-lg font-bold text-white transition-all duration-200 glow-purple"
              >
                Comenzar Ahora
                <ArrowRight className="h-5 w-5" />
              </a>
              <p className="mt-4 text-sm text-neutral-500">
                Un solo pago. Acceso inmediato.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default async function LandingPage() {
  const cuposAgotados = await checkCuposAgotados()

  return (
    <>
      <HeroSection cuposAgotados={cuposAgotados} />
      <FeatureBadgesSection />
      <ForYouSection />
      <ProblemSection cuposAgotados={cuposAgotados} />
      <FeaturesRowSection />

      <ForWhoSection />
      <ServicesSection />
      <CTABannerSection cuposAgotados={cuposAgotados} />
      <TestimonialsSection />
      <FAQSection />
      <PricingSection cuposAgotados={cuposAgotados} />
      <FinalCTASection cuposAgotados={cuposAgotados} />
    </>
  )
}
