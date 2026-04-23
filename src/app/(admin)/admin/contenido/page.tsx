import { getCourses } from '@/actions/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentManager } from '@/components/admin/content-manager'
import {
  BulkFolderUpload,
  type ExistingCapitulo,
  type ExistingCurso,
} from '@/components/admin/bulk-folder-upload'

export const metadata = { title: 'Admin - Contenido' }

export default async function AdminContentPage() {
  const { courses } = await getCourses()

  // Fetch all chapters + cursos for the bulk uploader (mixed mode —
  // audios + PDFs + videos in a single drop, routed by extension).
  const admin = createAdminClient()
  const { data: allCursos } = await admin
    .from('cursos')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('orden')

  const { data: allCapitulos } = await admin
    .from('capitulos')
    .select('id, curso_id, numero, nombre')
    .order('numero')

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
        Gestión de Contenido
      </h1>

      {/* Bulk upload — drag a folder with mixed content types at once */}
      <div className="mb-6">
        <BulkFolderUpload
          tipo="mixed"
          capitulos={(allCapitulos || []) as ExistingCapitulo[]}
          cursos={(allCursos || []) as ExistingCurso[]}
        />
      </div>

      <ContentManager courses={courses} />
    </div>
  )
}
