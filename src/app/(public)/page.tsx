import Link from 'next/link'
import {
  BookOpen,
  Headphones,
  Brain,
  Trophy,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-neutral-300">
            <Zap className="h-4 w-4 text-primary-400" />
            Plataforma #1 en español para contratistas
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Pasa tu examen de licencia de contratista{' '}
            <span className="text-primary-400 text-glow">en Florida</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-neutral-400 sm:text-xl">
            Estudia en español con audiolibros, PDF interactivo, banco de
            preguntas infinito y un asistente IA que te explica todo 24/7.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 text-lg font-bold text-white hover:bg-primary-500 transition-all duration-200 glow-blue sm:w-auto"
            >
              Comenzar Ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/precios"
              className="flex min-h-[56px] w-full items-center justify-center rounded-xl px-8 text-lg font-semibold text-neutral-300 glass glass-hover transition-all duration-200 sm:w-auto"
            >
              Ver Precios
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            Los cursos tradicionales te cobran $3,000+ y te dan fotocopias
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-neutral-400">
            Traducciones de Google, videos de 20 minutos, copias textuales del
            libro. Pagaste caro y no aprendiste nada. Nosotros cambiamos eso.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: 'PDF Interactivo',
                desc: 'Guía de estudio de 350 páginas con búsqueda, colores y tablas organizadas por capítulo.',
                color: 'text-primary-400',
                glow: 'from-primary-500/8',
              },
              {
                icon: Headphones,
                title: 'Audiolibros',
                desc: 'Estudia mientras trabajas o manejas. Cada módulo tiene su audiolibro en español.',
                color: 'text-emerald-400',
                glow: 'from-emerald-500/8',
              },
              {
                icon: Brain,
                title: 'Asistente IA 24/7',
                desc: 'Preguntale lo que sea sobre el examen. Te explica con ejemplos que ningún profesor da.',
                color: 'text-violet-400',
                glow: 'from-violet-500/8',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="relative rounded-2xl p-6 text-left glass-card overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.glow} to-transparent pointer-events-none`} />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            Todo lo que necesitas para aprobar
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Trophy,
                title: 'Modo Examen Cronometrado',
                desc: 'Simulacro real con temporizador. Elige cantidad de preguntas y capítulos.',
                color: 'text-amber-400',
              },
              {
                icon: CheckCircle,
                title: 'Feedback Inmediato',
                desc: 'Cada respuesta incorrecta muestra la correcta, la explicación y la página del libro.',
                color: 'text-emerald-400',
              },
              {
                icon: Clock,
                title: 'Entrena la Búsqueda',
                desc: 'Cada pregunta referencia la página del libro para entrenar tu memoria muscular.',
                color: 'text-primary-400',
              },
              {
                icon: Users,
                title: 'Comunidad de Contratistas',
                desc: 'Pregunta dudas por capítulo y encuentra trabajos con otros contratistas.',
                color: 'text-violet-400',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl p-5 glass-card"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-2xl rounded-2xl p-8 sm:p-12 text-center overflow-hidden glass-card glow-blue-strong">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/15 to-primary-500/5 pointer-events-none" />
          <div className="relative">
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
              Empieza a estudiar hoy
            </h2>
            <p className="mb-8 text-neutral-400">
              No pierdas más tiempo con métodos obsoletos. Únete a la plataforma
              que realmente te prepara para pasar el examen.
            </p>
            <Link
              href="/registro"
              className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 text-lg font-bold text-white hover:bg-primary-500 transition-all duration-200"
            >
              Crear Mi Cuenta
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
