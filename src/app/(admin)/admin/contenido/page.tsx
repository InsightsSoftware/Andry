import { getCourses } from '@/actions/admin'
import { ContentManager } from '@/components/admin/content-manager'

export const metadata = { title: 'Admin - Contenido' }

export default async function AdminContentPage() {
  const { courses } = await getCourses()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
        Gestión de Contenido
      </h1>
      <ContentManager courses={courses} />
    </div>
  )
}
