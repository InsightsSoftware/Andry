import { Video as VideoIcon } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { VideosManager } from '@/components/admin/videos-manager'

export const metadata = { title: 'Admin - Videos' }

export default async function AdminVideosPage() {
  const admin = createAdminClient()

  const { data: videos } = await admin
    .from('contenido')
    .select('id, titulo, descripcion, archivo_url, duracion_segundos, orden, created_at')
    .eq('tipo', 'video')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-500">
          <VideoIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Videos
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Videos con título y descripción que aparecen en la sección Videos de la app
          </p>
        </div>
      </div>

      <VideosManager items={(videos || []) as any} />
    </div>
  )
}
