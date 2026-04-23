import { getAllContentByType } from '@/actions/admin'
import { MediaManager, type MediaItem, type MediaCapitulo, type MediaCurso } from '@/components/admin/media-manager'

export const metadata = { title: 'Admin - Videos' }

export default async function AdminVideosPage() {
  const { items, capitulos, cursos } = await getAllContentByType('video')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Gestión de Videos
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Subir, editar títulos y eliminar videos explicativos y de aliados.
        </p>
      </div>

      <MediaManager
        tipo="video"
        items={items as MediaItem[]}
        capitulos={capitulos as MediaCapitulo[]}
        cursos={cursos as MediaCurso[]}
      />
    </div>
  )
}
