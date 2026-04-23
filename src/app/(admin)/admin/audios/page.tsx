import { getAllContentByType } from '@/actions/admin'
import { MediaManager, type MediaItem, type MediaCapitulo, type MediaCurso } from '@/components/admin/media-manager'

export const metadata = { title: 'Admin - Audios' }

export default async function AdminAudiosPage() {
  const { items, capitulos, cursos } = await getAllContentByType('audio')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Gestión de Audios
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Subir, editar títulos y eliminar audiolibros/narraciones por capítulo.
        </p>
      </div>

      <MediaManager
        tipo="audio"
        items={items as MediaItem[]}
        capitulos={capitulos as MediaCapitulo[]}
        cursos={cursos as MediaCurso[]}
      />
    </div>
  )
}
