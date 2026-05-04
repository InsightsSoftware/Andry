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
    target: '[data-tour="card-pdf"]',
    title: 'Modo Estudio — Guía PDF',
    body: 'Accedé a la guía oficial en PDF. Podés buscar por capítulo, hacer zoom y estudiar a tu ritmo.',
    placement: 'auto',
  },
  {
    target: '[data-tour="card-audio"]',
    title: 'Audio Estudio',
    body: 'Escuchá los audiolibros mientras manejás, hacés ejercicio o trabajás. Ideal para aprovechar cada momento.',
    placement: 'auto',
  },
  {
    target: '[data-tour="card-practica"]',
    title: 'Práctica y Examen',
    body: 'Dos modos: Práctica libre sin presión de tiempo, o Simulacro real cronometrado igual que el examen oficial.',
    placement: 'auto',
  },
  {
    target: '[data-tour="card-videos"]',
    title: 'Videos Explicativos',
    body: 'Tutoriales y explicaciones en video para los temas más complejos del examen.',
    placement: 'auto',
  },
  {
    target: '[data-tour="card-aliados"]',
    title: 'Aliados — Servicios para tu negocio',
    body: 'Empresas asociadas: créditos comerciales, contabilidad, software, seguros. Todo pensado para contratistas como vos.',
    placement: 'auto',
  },
  {
    target: '[data-tour="card-comunidad"]',
    title: 'Comunidad',
    body: 'Hacé preguntas de estudio, compartí trabajos o buscá subcontratistas. Filtros por oficio y buscador por título.',
    placement: 'auto',
  },
  {
    target: '[data-tour="tab-perfil"]',
    title: 'Tu perfil y suscripción',
    body: 'En "Perfil" manejás tu plan, ves el vencimiento y cerrás sesión. También podés volver a ver este tour cuando quieras.',
    placement: 'auto',
    mobileCenter: true,
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
