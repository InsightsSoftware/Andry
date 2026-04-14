import { getQuestions } from '@/actions/admin'
import { CSVUploader } from '@/components/admin/csv-uploader'
import { QuestionList } from '@/components/admin/question-list'

export const metadata = { title: 'Admin - Preguntas' }

export default async function AdminQuestionsPage() {
  const result = await getQuestions()
  const questions = result.questions as unknown as {
    id: string
    texto: string
    respuesta_correcta: string
    pagina_libro: number | null
    capitulo_id: string
    capitulos: { nombre: string; cursos: { nombre: string } | null } | null
  }[]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Banco de Preguntas
      </h1>

      {/* CSV Upload */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
          Subir Preguntas (CSV)
        </h2>
        <CSVUploader />
      </div>

      {/* Questions list */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
          Preguntas Existentes ({questions.length})
        </h2>
        <QuestionList questions={questions} />
      </div>
    </div>
  )
}
