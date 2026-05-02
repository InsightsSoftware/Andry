import { CommunityStats } from '@/components/comunidad/community-stats'
import { CommunityHub } from '@/components/comunidad/community-hub'

export const metadata = { title: 'Comunidad' }

export default function ComunidadPage() {
  return (
    <>
      <CommunityStats />
      <CommunityHub />
    </>
  )
}
