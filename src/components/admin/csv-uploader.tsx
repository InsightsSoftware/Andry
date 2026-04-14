'use client'

import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { uploadQuestions, getChapters, getCourses } from '@/actions/admin'

interface ParsedQuestion {
  texto: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
  explicacion: string
  pagina_libro: number
}

interface Course {
  id: string
  nombre: string
}

interface Chapter {
  id: string
  nombre: string
  numero: number
}

export function CSVUploader() {
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select')
  const [courses, setCourses] = useState<Course[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load courses on first render
  const loadCourses = async () => {
    if (courses.length > 0) return
    const result = await getCourses()
    setCourses(result.courses || [])
  }

  const handleCourseChange = async (cursoId: string) => {
    setSelectedCourse(cursoId)
    setSelectedChapter('')
    if (cursoId) {
      const result = await getChapters(cursoId)
      setChapters(result.chapters || [])
    } else {
      setChapters([])
    }
  }

  const parseCSV = (text: string): { parsed: ParsedQuestion[]; errors: string[] } => {
    const lines = text.split('\n').filter((l) => l.trim())
    const parsed: ParsedQuestion[] = []
    const errs: string[] = []

    // Skip header if present
    const start = lines[0]?.toLowerCase().includes('texto') ? 1 : 0

    for (let i = start; i < lines.length; i++) {
      const line = lines[i]
      // Handle CSV with quoted fields
      const cols = parseCSVLine(line)

      if (cols.length < 8) {
        errs.push(`Fila ${i + 1}: Necesita 8 columnas, tiene ${cols.length}`)
        continue
      }

      const [texto, opcion_a, opcion_b, opcion_c, opcion_d, respuesta, explicacion, pagina] =
        cols.map((c) => c.trim())

      if (!texto || !opcion_a || !opcion_b || !opcion_c || !opcion_d) {
        errs.push(`Fila ${i + 1}: Faltan campos requeridos`)
        continue
      }

      const resp = respuesta.toLowerCase()
      if (!['a', 'b', 'c', 'd'].includes(resp)) {
        errs.push(
          `Fila ${i + 1}: Respuesta correcta debe ser a, b, c o d (tiene "${respuesta}")`
        )
        continue
      }

      const pag = parseInt(pagina) || 0

      parsed.push({
        texto,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta: resp,
        explicacion: explicacion || '',
        pagina_libro: pag,
      })
    }

    return { parsed, errors: errs }
  }

  // Simple CSV line parser that handles quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { parsed, errors: parseErrors } = parseCSV(text)
      setQuestions(parsed)
      setErrors(parseErrors)
      if (parsed.length > 0) {
        setStep('preview')
      }
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!selectedChapter || questions.length === 0) return
    setUploading(true)
    const result = await uploadQuestions(selectedChapter, questions)
    setUploading(false)

    if (result.success) {
      setUploadResult(`${result.count} preguntas subidas correctamente`)
      setStep('done')
    } else {
      setErrors([result.error || 'Error al subir preguntas'])
    }
  }

  const handleReset = () => {
    setStep('select')
    setQuestions([])
    setErrors([])
    setUploadResult(null)
    setSelectedChapter('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
      {step === 'done' ? (
        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <Check className="h-8 w-8 text-success-600 dark:text-success-400" />
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {uploadResult}
          </p>
          <button
            onClick={handleReset}
            className="mt-4 rounded-xl bg-primary-600 dark:bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors cursor-pointer"
          >
            Subir más preguntas
          </button>
        </div>
      ) : (
        <>
          {/* Course / Chapter selector */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Curso
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                onFocus={loadCourses}
                className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:outline-none"
              >
                <option value="">Seleccionar curso...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Capítulo
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={!selectedCourse}
                className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">Seleccionar capítulo...</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Cap. {c.numero}: {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File input */}
          {step === 'select' && (
            <div className="mt-4">
              <label
                className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
                  selectedChapter
                    ? 'border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                    : 'border-neutral-200 dark:border-neutral-700 opacity-50'
                }`}
              >
                <Upload className="mb-3 h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {selectedChapter
                    ? 'Haz click o arrastra un archivo CSV'
                    : 'Selecciona curso y capítulo primero'}
                </p>
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  Formato: texto, opcion_a, opcion_b, opcion_c, opcion_d,
                  respuesta_correcta, explicacion, pagina_libro
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={!selectedChapter}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-danger-600 dark:text-danger-400" />
                <p className="text-sm font-medium text-danger-700 dark:text-danger-400">
                  {errors.length} error{errors.length > 1 ? 'es' : ''}
                </p>
              </div>
              <ul className="text-xs text-danger-600 dark:text-danger-400 space-y-0.5 max-h-32 overflow-y-auto">
                {errors.map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && questions.length > 0 && (
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <FileText className="mr-1.5 inline h-4 w-4" />
                  {questions.length} preguntas listas para subir
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="mr-1 inline h-3 w-3" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 dark:bg-primary-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    {uploading ? 'Subiendo...' : 'Confirmar Subida'}
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-neutral-500 dark:text-neutral-400">
                        #
                      </th>
                      <th className="px-3 py-2 text-left text-neutral-500 dark:text-neutral-400">
                        Pregunta
                      </th>
                      <th className="px-3 py-2 text-left text-neutral-500 dark:text-neutral-400">
                        Resp.
                      </th>
                      <th className="px-3 py-2 text-left text-neutral-500 dark:text-neutral-400">
                        Pág.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, i) => (
                      <tr
                        key={i}
                        className="border-t border-neutral-100 dark:border-neutral-800"
                      >
                        <td className="px-3 py-2 text-neutral-400 dark:text-neutral-500">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200 max-w-xs truncate">
                          {q.texto}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-primary-600 dark:text-primary-400 uppercase">
                          {q.respuesta_correcta}
                        </td>
                        <td className="px-3 py-2 text-neutral-400 dark:text-neutral-500">
                          {q.pagina_libro || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
