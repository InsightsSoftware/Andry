import { CommunityStats } from '@/components/comunidad/community-stats'
import { CommunityHub } from '@/components/comunidad/community-hub'

export const metadata = { title: 'Comunidad' }

// Los contadores (miembros, dudas, trabajos) cambian seguido. Sin esto, Next
// prerenderiza la página estática y el número de miembros queda congelado
// (ej: borraste usuarios y el index seguía mostrando el conteo viejo).
export const dynamic = 'force-dynamic'

export default function ComunidadPage() {
  return (
    <>
      <CommunityStats />
      <CommunityHub />
    </>
  )
}
