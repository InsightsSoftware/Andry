import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Modo Estudio' }

export default async function EstudioPage() {
  const supabase = await createClient()
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug, descripcion, imagen_url')
    .eq('activo', true)
    .order('orden')

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">
        Modo Estudio
      </h1>
      <p className="mb-6 text-neutral-500">
        Selecciona un curso para comenzar a estudiar
      </p>

      {cursos && cursos.length > 0 ? (
        <div className="flex flex-col gap-4">
          {cursos.map((curso) => (
            <Link
              key={curso.id}
              href={`/estudio/${curso.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                <BookOpen className="h-7 w-7 text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-neutral-900">{curso.nombre}</h2>
                <p className="text-sm text-neutral-500">{curso.descripcion}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-neutral-500">
            Los cursos se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      )}
    </div>
  )
}
