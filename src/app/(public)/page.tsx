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
  Star,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-600 to-primary-800 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
            <Star className="h-4 w-4 text-accent-100" />
            Plataforma #1 en español para contratistas
          </div>
          <h1 className="mb-6 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Pasa tu examen de licencia de contratista{' '}
            <span className="text-accent-100">en Florida</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-100 sm:text-xl">
            Estudia en español con audiolibros, PDF interactivo, banco de
            preguntas infinito y un asistente IA que te explica todo 24/7.
            El método que realmente funciona.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-white dark:bg-neutral-900 px-8 text-lg font-bold text-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors sm:w-auto"
            >
              Comenzar Ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/precios"
              className="flex min-h-[56px] w-full items-center justify-center rounded-xl border-2 border-white/30 px-8 text-lg font-semibold text-white hover:bg-white/10 transition-colors sm:w-auto"
            >
              Ver Precios
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            Los cursos tradicionales te cobran $3,000+ y te dan fotocopias
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-neutral-600 dark:text-neutral-400">
            Traducciones de Google, videos de 20 minutos, copias textuales del
            libro. Pagaste caro y no aprendiste nada. Nosotros cambiamos eso.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: 'PDF Interactivo',
                desc: 'Guía de estudio de 350 páginas con búsqueda, colores y tablas organizadas por capítulo.',
              },
              {
                icon: Headphones,
                title: 'Audiolibros',
                desc: 'Estudia mientras trabajas o manejas. Cada módulo tiene su audiolibro en español.',
              },
              {
                icon: Brain,
                title: 'Asistente IA 24/7',
                desc: 'Preguntale lo que sea sobre el examen. Te explica con ejemplos que ningún profesor da.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-left"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                  <item.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-neutral-100 dark:bg-neutral-800 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            Todo lo que necesitas para aprobar
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Trophy,
                title: 'Modo Examen Cronometrado',
                desc: 'Simulacro real con temporizador. Elige cantidad de preguntas y capítulos.',
              },
              {
                icon: CheckCircle,
                title: 'Feedback Inmediato',
                desc: 'Cada respuesta incorrecta muestra la correcta, la explicación y la página del libro.',
              },
              {
                icon: Clock,
                title: 'Entrena la Búsqueda',
                desc: 'Cada pregunta referencia la página del libro para entrenar tu memoria muscular.',
              },
              {
                icon: Users,
                title: 'Comunidad de Contratistas',
                desc: 'Pregunta dudas por capítulo y encuentra trabajos con otros contratistas.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl bg-white dark:bg-neutral-900 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <item.icon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-neutral-900 dark:text-neutral-100">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-primary-600 p-8 text-center sm:p-12">
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            Empieza a estudiar hoy
          </h2>
          <p className="mb-8 text-primary-100">
            No pierdas más tiempo con métodos obsoletos. Únete a la plataforma
            que realmente te prepara para pasar el examen.
          </p>
          <Link
            href="/registro"
            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-white dark:bg-neutral-900 px-8 text-lg font-bold text-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Crear Mi Cuenta
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
