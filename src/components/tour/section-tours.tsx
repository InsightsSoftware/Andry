'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TourGuide, type TourStep } from './tour-guide'

// ── Storage keys ───────────────────────────────────────────────────────────────
export const ESTUDIO_TOUR_KEY   = 'yexamprep:tour:estudio:v1'
export const PRACTICA_TOUR_KEY  = 'yexamprep:tour:practica:v1'
export const COMUNIDAD_TOUR_KEY = 'yexamprep:tour:comunidad:v1'
export const ALIADOS_TOUR_KEY   = 'yexamprep:tour:aliados:v1'

// ── Step definitions ───────────────────────────────────────────────────────────
const ESTUDIO_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Guía de Estudio',
    body: 'Acá encontrás todo el material para prepararte: PDF por capítulo, audiolibros, videos y banco de preguntas.',
  },
  {
    target: '[data-tour="estudio-curso-card"]',
    title: 'Seleccioná tu curso',
    body: 'Hacé clic en un curso para ver sus capítulos. Cada uno tiene el PDF, el audio y las preguntas de práctica.',
    placement: 'auto',
  },
  {
    target: '[data-tour="estudio-chapter-grid"]',
    title: 'Capítulos del curso',
    body: 'Cada tarjeta es un capítulo. Hacé clic para abrir el PDF directamente desde el visor integrado.',
    placement: 'auto',
  },
  {
    target: null,
    title: '¡Listo para estudiar! 📖',
    body: 'Empezá por el capítulo 1 y avanzá a tu ritmo. Cuando quieras practicar, usá la sección "Práctica".',
  },
]

const PRACTICA_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Práctica y Examen',
    body: 'Dos modos distintos según cómo quieras prepararte. Elegí el que mejor se adapte a tu momento.',
  },
  {
    target: '[data-tour="practica-mode-libre"]',
    title: 'Práctica Libre',
    body: 'Sin reloj. Ves la respuesta correcta y la explicación después de cada pregunta. Ideal para aprender.',
    placement: 'auto',
  },
  {
    target: '[data-tour="practica-mode-examen"]',
    title: 'Examen Simulación Real',
    body: 'Con tiempo límite, igual al examen real. Todas las respuestas se evalúan al final. Ideal para medir tu nivel.',
    placement: 'auto',
  },
  {
    target: '[data-tour="practica-config"]',
    title: 'Configurá tu sesión',
    body: 'Elegí cuántas preguntas, de qué capítulo y la duración. Podés personalizar cada sesión de práctica.',
    placement: 'auto',
  },
  {
    target: null,
    title: '¡A practicar! 🎯',
    body: 'Cuantas más preguntas hagas, mejor preparado vas a estar para el examen real.',
  },
]

const COMUNIDAD_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Comunidad de Contratistas',
    body: 'Un espacio para conectar con otros: publicar y encontrar trabajos, buscar subcontratistas y hacer preguntas.',
  },
  {
    target: '[data-tour="comunidad-post-list"]',
    title: 'Avisos publicados',
    body: 'Cada aviso muestra el oficio, la ubicación y el presupuesto estimado. Hacé clic para ver los detalles y contactar.',
    placement: 'auto',
  },
  {
    target: '[data-tour="comunidad-post-form"]',
    title: 'Publicar un aviso',
    body: 'Buscás trabajo o subcontratistas? Completá el formulario con tu oficio, ubicación y descripción.',
    placement: 'auto',
  },
  {
    target: '[data-tour="comunidad-filters"]',
    title: 'Filtrar por oficio',
    body: 'Usá los filtros para ver solo los avisos de tu especialidad o de la zona donde operás.',
    placement: 'auto',
  },
  {
    target: null,
    title: '¡Conectá con la comunidad! 🤝',
    body: 'Todos los usuarios del plan activo tienen acceso. Respondé preguntas, compartí trabajo y armá tu red.',
  },
]

const ALIADOS_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Aliados del Contratista',
    body: 'Empresas y servicios seleccionados especialmente para contratistas: crédito, contabilidad, software y más.',
  },
  {
    target: '[data-tour="aliados-grid"]',
    title: 'Empresas asociadas',
    body: 'Cada tarjeta es un aliado estratégico. Ves su nombre, logo, descripción y los medios de contacto disponibles.',
    placement: 'auto',
  },
  {
    target: '[data-tour="aliados-contact"]',
    title: 'Contacto directo',
    body: 'Podés escribir por WhatsApp, enviar un email o llamar directamente desde la tarjeta. Sin intermediarios.',
    placement: 'auto',
  },
  {
    target: null,
    title: '¡Aprovechá los aliados! 💼',
    body: 'Son socios que conocen las necesidades del contratista. Consultales sin compromiso.',
  },
]

// ── Generic inner component (needs useSearchParams) ────────────────────────────
function SectionTourInner({
  steps,
  storageKey,
}: {
  steps: TourStep[]
  storageKey: string
}) {
  const searchParams = useSearchParams()
  const force = searchParams.get('tour') === '1'
  return <TourGuide steps={steps} storageKey={storageKey} force={force} />
}

// ── Public exports ─────────────────────────────────────────────────────────────
export function EstudioTour() {
  return (
    <Suspense fallback={null}>
      <SectionTourInner steps={ESTUDIO_STEPS} storageKey={ESTUDIO_TOUR_KEY} />
    </Suspense>
  )
}

export function PracticaTour() {
  return (
    <Suspense fallback={null}>
      <SectionTourInner steps={PRACTICA_STEPS} storageKey={PRACTICA_TOUR_KEY} />
    </Suspense>
  )
}

export function ComunidadTour() {
  return (
    <Suspense fallback={null}>
      <SectionTourInner steps={COMUNIDAD_STEPS} storageKey={COMUNIDAD_TOUR_KEY} />
    </Suspense>
  )
}

export function AliadosTour() {
  return (
    <Suspense fallback={null}>
      <SectionTourInner steps={ALIADOS_STEPS} storageKey={ALIADOS_TOUR_KEY} />
    </Suspense>
  )
}
