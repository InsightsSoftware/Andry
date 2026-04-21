import { getQuestions, listCsvBackups } from '@/actions/admin'
import { CSVUploader } from '@/components/admin/csv-uploader'
import { QuestionList } from '@/components/admin/question-list'
import { CsvBackupsList } from '@/components/admin/csv-backups-list'

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
  const [questionsResult, backupsResult] = await Promise.all([
    getQuestions(),
    listCsvBackups(),
  ])

  const questions = questionsResult.questions as unknown as {
    id: string
    texto: string
    respuesta_correcta: string
    pagina_libro: number | null
    capitulo_id: string
    capitulos: { nombre: string; cursos: { nombre: string } | null } | null
  }[]
  const backups = (backupsResult.backups || []) as unknown as BackupRow[]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
        Banco de Preguntas
      </h1>

      {/* CSV Upload */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
          Subir Preguntas (CSV)
        </h2>
        <CSVUploader />
      </div>

      {/* Backups — history of uploaded CSVs, restore + undo */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200">
            Historial de backups
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {backups.length} {backups.length === 1 ? 'archivo' : 'archivos'}{' '}
            guardado{backups.length === 1 ? '' : 's'}
          </p>
        </div>
        <CsvBackupsList initialBackups={backups} />
      </div>

      {/* Questions list */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
          Preguntas Existentes ({questions.length})
        </h2>
        <QuestionList questions={questions} />
      </div>
    </div>
  )
}
