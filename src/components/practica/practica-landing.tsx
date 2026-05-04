'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BookOpenCheck, Timer, ArrowRight, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PracticaTour } from '@/components/tour/section-tours'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Capitulo {
  id: string
  nombre: string
  numero: number
  questionCount: number
}

interface Curso {
  id: string
  nombre: string
  capitulos: Capitulo[]
}

interface Props {
  cursosConCapitulos: Curso[]
  errorCode?: string | null
}

type Mode   = 'libre' | 'examen' | null
type Fuente = 'especifico' | 'random' | 'balanceado'

const CANTIDADES_LIBRE  = [5, 10, 15, 20, 25, 30, 40, 50]
const CANTIDADES_EXAMEN = [25, 50, 75, 100, 125]

const DURACIONES_LIBRE  = ['Sin límite', '15 min', '30 min', '45 min', '1 hora', '1.5 horas', '2 horas']
const DURACIONES_EXAMEN = ['2 horas', '3 horas', '4 horas', '5 horas', '6 horas']

// ── Component ─────────────────────────────────────────────────────────────────

export function PracticaLanding({ cursosConCapitulos, errorCode }: Props) {
  const router = useRouter()

  const [mode,       setMode]       = useState<Mode>(null)
  const [fuente,     setFuente]     = useState<Fuente>('especifico')
  const [capituloId, setCapituloId] = useState<string>('')
  const [cantidad,   setCantidad]   = useState<number>(15)
  const [duracion,   setDuracion]   = useState<string>('Sin límite')

  // Flatten chapters from all courses
  const allChapters = cursosConCapitulos.flatMap((c) => c.capitulos)

  // Questions available for the currently selected chapter / mode
  const selectedChapter = allChapters.find((c) => c.id === capituloId)
  const totalQuestionsAvailable = fuente === 'especifico'
    ? (selectedChapter?.questionCount ?? 0)
    : allChapters.reduce((sum, c) => sum + c.questionCount, 0)
  const noQuestions = totalQuestionsAvailable === 0

  function handleSelectMode(m: 'libre' | 'examen') {
    const next = mode === m ? null : m
    setMode(next)
    // Reset defaults per mode
    if (next === 'libre') {
      setDuracion('Sin límite')
      setFuente('especifico')
      setCantidad(15)
      if (!capituloId && allChapters.length > 0) setCapituloId(allChapters[0].id)
    }
    if (next === 'examen') {
      setDuracion('2 horas')
      setFuente('random')   // Simulación Real always uses random questions
      setCantidad(25)
    }
  }

  function handleFuenteChange(v: Fuente) {
    setFuente(v)
    if (v === 'especifico' && !capituloId && allChapters.length > 0) {
      setCapituloId(allChapters[0].id)
    }
  }

  function handleComenzar() {
    const params = new URLSearchParams()
    params.set('fuente',   fuente)
    params.set('cantidad', String(cantidad))
    params.set('duracion', duracion)
    if (fuente === 'especifico' && capituloId) params.set('capitulo_id', capituloId)

    params.set('tipo', mode === 'examen' ? 'examen' : 'libre')
    router.push(`/practica/sesion?${params.toString()}`)
  }

  return (
    <div>
      <PracticaTour />

      {/* Error banner */}
      {errorCode === 'sin_preguntas' && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Sin preguntas disponibles</strong> — El capítulo seleccionado todavía no tiene preguntas cargadas. Elegí otro capítulo o pedile al administrador que suba el banco de preguntas.
          </p>
        </div>
      )}
      {/* ── Mode cards ─────────────────────────────────────────────────────── */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">

        {/* Práctica Libre */}
        <button
          data-tour="practica-mode-libre"
          onClick={() => handleSelectMode('libre')}
          className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl min-h-[280px] cursor-pointer text-left transition-all duration-300 ${
            mode === 'libre'
              ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-neutral-50 dark:ring-offset-neutral-950'
              : 'hover:scale-[1.01]'
          }`}
        >
          <Image
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80"
            alt="Práctica Libre"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          {/* Selected badge */}
          {mode === 'libre' && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Seleccionado
            </div>
          )}
          <div className="relative z-10 p-6">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-sm transition-colors ${
              mode === 'libre' ? 'bg-violet-500/40 border-violet-400/60' : 'bg-violet-500/20 border-violet-400/30'
            }`}>
              <BookOpenCheck className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="mb-1.5 text-xl font-bold text-white">Práctica Libre</h2>
            <p className="mb-4 text-sm text-white/70 leading-relaxed">
              Sin reloj ni presión. Elegí un capítulo y practicá a tu ritmo.
            </p>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all ${
              mode === 'libre'
                ? 'bg-violet-500'
                : 'bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20'
            }`}>
              {mode === 'libre' ? 'Configurar abajo ↓' : 'Configurar sesión'}
            </span>
          </div>
        </button>

        {/* Simulación Real */}
        <button
          data-tour="practica-mode-examen"
          onClick={() => handleSelectMode('examen')}
          className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl min-h-[280px] cursor-pointer text-left transition-all duration-300 ${
            mode === 'examen'
              ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-neutral-50 dark:ring-offset-neutral-950'
              : 'hover:scale-[1.01]'
          }`}
        >
          <Image
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
            alt="Simulación Real"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          {/* Selected badge */}
          {mode === 'examen' && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Seleccionado
            </div>
          )}
          <div className="relative z-10 p-6">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-sm transition-colors ${
              mode === 'examen' ? 'bg-amber-500/40 border-amber-400/60' : 'bg-amber-500/20 border-amber-400/30'
            }`}>
              <Timer className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="mb-1.5 text-xl font-bold text-white">Simulación Real</h2>
            <p className="mb-4 text-sm text-white/70 leading-relaxed">
              Examen con tiempo (2–6 horas), preguntas aleatorias. Requiere 70% para aprobar.
            </p>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all ${
              mode === 'examen'
                ? 'bg-amber-500'
                : 'bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20'
            }`}>
              {mode === 'examen' ? 'Configurar abajo ↓' : 'Configurar examen'}
            </span>
          </div>
        </button>
      </div>

      {/* ── Config panel ───────────────────────────────────────────────────── */}
      {mode && (
        <div data-tour="practica-config" className="rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          {/* Header */}
          <div className="mb-5 flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              mode === 'libre' ? 'bg-violet-100 dark:bg-violet-500/15' : 'bg-amber-100 dark:bg-amber-500/15'
            }`}>
              {mode === 'libre'
                ? <BookOpenCheck className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                : <Timer className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {mode === 'libre' ? 'Modo Práctica Libre' : 'Modo Simulación Real'}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Configurá el origen y el volumen de preguntas antes de comenzar.
              </p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Fuente — only in libre mode */}
            {mode === 'libre' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Fuente de preguntas
                </label>
                <div className="relative">
                  <select
                    value={fuente}
                    onChange={(e) => handleFuenteChange(e.target.value as Fuente)}
                    className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 pr-10 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer transition-colors"
                  >
                    <option value="especifico">Capítulo específico</option>
                    <option value="random">Random</option>
                    <option value="balanceado">Balanceado</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>
              </div>
            )}

            {/* Capítulo — only when libre + específico */}
            {mode === 'libre' && fuente === 'especifico' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Capítulo
                </label>
                <div className="relative">
                  <select
                    value={capituloId}
                    onChange={(e) => setCapituloId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 pr-10 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer transition-colors"
                  >
                    {allChapters.length === 0 && (
                      <option value="">Sin capítulos disponibles</option>
                    )}
                    {allChapters.map((cap) => (
                      <option key={cap.id} value={cap.id}>
                        {cap.numero >= 11
                          ? cap.nombre
                          : `Capítulo ${String(cap.numero).padStart(2, '0')} — ${cap.nombre}`
                        }{cap.questionCount === 0 ? ' (sin preguntas)' : ` · ${cap.questionCount} preguntas`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Cantidad de preguntas
              </label>
              <div className="relative">
                <select
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 pr-10 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer transition-colors"
                >
                  {(mode === 'examen' ? CANTIDADES_EXAMEN : CANTIDADES_LIBRE).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              </div>
            </div>

            {/* Duración — solo en examen (libre siempre es sin límite) */}
            {mode === 'examen' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Duración
                </label>
                <div className="relative">
                  <select
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 pr-10 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer transition-colors"
                  >
                    {DURACIONES_EXAMEN.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleComenzar}
                disabled={(fuente === 'especifico' && !capituloId) || noQuestions}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === 'libre'
                    ? 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700'
                    : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600'
                }`}
              >
                Comenzar sesión
                <ArrowRight className="h-4 w-4" />
              </button>
              {noQuestions && capituloId && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Este capítulo no tiene preguntas cargadas aún.
                </p>
              )}
              {noQuestions && fuente !== 'especifico' && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No hay preguntas disponibles en ningún capítulo aún.
                </p>
              )}
            </div>
            <button
              onClick={() => setMode(null)}
              className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
