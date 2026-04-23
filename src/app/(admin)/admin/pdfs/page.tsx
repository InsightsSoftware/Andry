import { getAllContentByType } from '@/actions/admin'
import { MediaManager, type MediaItem, type MediaCapitulo, type MediaCurso } from '@/components/admin/media-manager'

export const metadata = { title: 'Admin - PDFs' }

export default async function AdminPdfsPage() {
  const { items, capitulos, cursos } = await getAllContentByType('pdf')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Gestión de PDFs
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Subir, editar títulos y eliminar guías de estudio y documentos por capítulo.
        </p>
      </div>

      <MediaManager
        tipo="pdf"
        items={items as MediaItem[]}
        capitulos={capitulos as MediaCapitulo[]}
        cursos={cursos as MediaCurso[]}
      />
    </div>
  )
}
