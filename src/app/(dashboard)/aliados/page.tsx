import { Handshake, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PartnersGrid, type PartnerWithVideos } from '@/components/aliados/partners-grid'
import { getSignedContentUrl } from '@/lib/supabase/storage'
import type { Partner, PartnerVideo } from '@/types/database'

export const metadata = { title: 'Aliados' }

export default async function AliadosPage() {
  const supabase = await createClient()

  const { data: rawPartners } = await supabase
    .from('partners')
    .select('*')
    .eq('activo', true)
    .order('destacado', { ascending: false })
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false })

  const partners = (rawPartners || []) as Partner[]

  // All videos for the active partners, ordered (orden 0 = principal).
  const { data: rawVideos } = await supabase
    .from('partner_videos')
    .select('*')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  const allVideos = (rawVideos || []) as PartnerVideo[]

  // Sign Supabase-storage URLs; external (YouTube) pass through unchanged.
  async function resolve(url: string): Promise<string> {
    try {
      return await getSignedContentUrl(supabase, url, 3600)
    } catch {
      return url
    }
  }

  const partnersWithVideos: PartnerWithVideos[] = await Promise.all(
    partners.map(async (p) => {
      const own = allVideos.filter((v) => v.partner_id === p.id)

      let videos: PartnerVideo[]
      if (own.length > 0) {
        videos = await Promise.all(
          own.map(async (v) => ({ ...v, video_url: await resolve(v.video_url) }))
        )
      } else {
        // Fallback for partners that still only have the legacy single video.
        videos = [
          {
            id: `legacy-${p.id}`,
            partner_id: p.id,
            titulo: p.nombre,
            descripcion: p.descripcion,
            video_url: await resolve(p.video_url),
            orden: 0,
            created_at: p.created_at,
          },
        ]
      }

      return {
        ...p,
        imagen_portada: p.imagen_portada ? await resolve(p.imagen_portada) : null,
        videos,
      }
    })
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/20 text-accent-500">
            <Handshake className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-0.5 inline-flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-500">
              <Sparkles className="h-2.5 w-2.5" />
              Aliados
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Servicios para tu negocio
            </h1>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
          Empresas con las que colaboramos para ayudarte a hacer crecer tu
          compañía de contratista: créditos, contabilidad, software,
          seguros y más.
        </p>
      </div>

      <PartnersGrid partners={partnersWithVideos} />
    </div>
  )
}
