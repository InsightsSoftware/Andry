'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TourGuide, type TourStep } from './tour-guide'

export const DASHBOARD_TOUR_STORAGE_KEY = 'yexamprep:tour:dashboard:v1'

const STEPS: TourStep[] = [
  {
    target: null,
    title: '¡Hola! Bienvenido a Y Exam Prep 👋',
    body: 'Te muestro en 30 segundos cómo moverte por la plataforma. Podés saltar el tour cuando quieras con el botón X.',
  },
  {
    target: '[data-tour="card-estudio"]',
    title: 'Acá está tu material de estudio',
    body: 'La guía en PDF, los audiolibros, los videos explicativos, el banco de preguntas y el simulacro de examen. Todo en un solo lugar.',
    placement: 'auto',
  },
  {
    target: '[data-tour="tab-aliados"], [data-tour="card-aliados"]',
    title: 'Servicios para tu negocio',
    body: 'Empresas asociadas — créditos comerciales, contabilidad, software, seguros. Todo pensado para contratistas como vos.',
    placement: 'auto',
  },
  {
    target: '[data-tour="card-comunidad"]',
    title: 'Conectá con la comunidad',
    body: 'Hacé preguntas de estudio, compartí trabajos o buscá subcontratistas. Filtros por oficio, buscador por título.',
    placement: 'auto',
  },
  {
    target: '[data-tour="tab-perfil"]',
    title: 'Tu perfil y suscripción',
    body: 'Desde acá manejás tu plan, ves el vencimiento y cerrás sesión. También podés volver a ver este tour cuando quieras.',
    placement: 'auto',
  },
  {
    target: null,
    title: 'Listo, ¡a estudiar! 💪',
    body: 'Si te perdés, tocá tu perfil y "Ver tour de nuevo". Cualquier duda, usá la comunidad.',
  },
]

function DashboardTourInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Only render on /panel. Avoids running on every dashboard page.
  if (pathname !== '/panel') return null

  // `?tour=1` forces the tour to re-open regardless of localStorage
  const force = searchParams.get('tour') === '1'

  return (
    <TourGuide
      steps={STEPS}
      storageKey={DASHBOARD_TOUR_STORAGE_KEY}
      force={force}
    />
  )
}

export function DashboardTour() {
  return (
    <Suspense fallback={null}>
      <DashboardTourInner />
    </Suspense>
  )
}
