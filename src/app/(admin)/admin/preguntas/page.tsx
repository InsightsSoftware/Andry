import { getQuestions, listCsvBackups } from '@/actions/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { PreguntasManager, type PMCurso, type PMCapitulo } from '@/components/admin/preguntas-manager'

export const metadata = { title: 'Admin - Preguntas' }

type BackupRow = {
  id: string
  capitulo_id: string
  archivo_nombre: string
  cantidad_preguntas: number
  created_at: string
  capitulos: {
    nombre: string
    numero: number
    cursos: { nombre: string } | null
  } | null
}

export default async function AdminQuestionsPage() {
  const admin = createAdminClient()

  const [questionsResult, backupsResult, cursosRes, capitulosRes] = await Promise.all([
    getQuestions(),
    listCsvBackups(),
    admin.from('cursos').select('id, nombre').eq('activo', true).order('orden'),
    admin.from('capitulos').select('id, curso_id, numero, nombre').order('numero'),
  ])

  const questions = (questionsResult.questions ?? []) as unknown as {
    id: string
    texto: string
    respuesta_correcta: string
    pagina_libro: number | null
    capitulo_id: string
    imagen_url: string | null
    capitulos: { nombre: string; cursos: { nombre: string } | null } | null
  }[]

  const backups  = (backupsResult.backups ?? []) as unknown as BackupRow[]
  const cursos   = (cursosRes.data   ?? []) as PMCurso[]
  const capitulos = (capitulosRes.data ?? []) as PMCapitulo[]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
        Banco de Preguntas
      </h1>

      <PreguntasManager
        cursos={cursos}
        capitulos={capitulos}
        questions={questions}
        backups={backups}
      />
    </div>
  )
}
