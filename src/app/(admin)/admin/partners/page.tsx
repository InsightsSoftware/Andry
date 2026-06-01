import { Handshake } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PartnersManager } from '@/components/admin/partners-manager'
import type { Partner, PartnerVideo } from '@/types/database'

export const metadata = { title: 'Aliados — Admin' }

export default async function AdminPartnersPage() {
  const admin = createAdminClient()
  const { data: partners } = await admin
    .from('partners')
    .select('*')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false })

  const { data: videos } = await admin
    .from('partner_videos')
    .select('*')
    .order('orden', { ascending: true })

  // Group videos by partner id
  const videosByPartner: Record<string, PartnerVideo[]> = {}
  for (const v of (videos || []) as PartnerVideo[]) {
    ;(videosByPartner[v.partner_id] ??= []).push(v)
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/20 text-accent-500">
          <Handshake className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Aliados
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Empresas recomendadas que aparecen en la sección Aliados de la app
          </p>
        </div>
      </div>

      <PartnersManager
        initialPartners={(partners || []) as Partner[]}
        videosByPartner={videosByPartner}
      />
    </div>
  )
}
