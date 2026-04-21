import { Handshake, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PartnersGrid } from '@/components/aliados/partners-grid'
import { getSignedContentUrl } from '@/lib/supabase/storage'
import type { Partner } from '@/types/database'

export const metadata = { title: 'Aliados' }

export default async function AliadosPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('partners')
    .select('*')
    .eq('activo', true)
    .order('destacado', { ascending: false })
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false })

  const partners = (raw || []) as Partner[]

  // Resolve video URLs server-side. External URLs (YouTube, etc) pass
  // through unchanged; Supabase storage paths get signed.
  const withUrls = await Promise.all(
    partners.map(async (p) => {
      let resolvedVideoUrl = p.video_url
      try {
        resolvedVideoUrl = await getSignedContentUrl(
          supabase,
          p.video_url,
          3600
        )
      } catch {
        // If signing fails we still render the partner — the video just
        // won't play. Better than hiding a partner entirely.
      }
      return { ...p, video_url: resolvedVideoUrl }
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

      <PartnersGrid partners={withUrls} />
    </div>
  )
}
