'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Headphones,
  Video,
  Plus,
  Trash2,
  Loader2,
  Link2,
  Upload,
  BookPlus,
  FolderPlus,
  X,
} from 'lucide-react'
import {
  getChapters,
  getContent,
  createContent,
  deleteContent,
  createCourse,
  createChapter,
  deleteCourse,
  deleteChapter,
} from '@/actions/admin'
import { FileUploader } from './file-uploader'

interface Course {
  id: string
  nombre: string
  slug: string
  activo: boolean
}

interface Chapter {
  id: string
  nombre: string
  numero: number
}

interface ContentItem {
  id: string
  titulo: string
  tipo: string
  archivo_url: string
  duracion_segundos: number | null
  orden: number
}

const tipoIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  audio: Headphones,
  video: Video,
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function ContentManager({ courses: initialCourses }: { courses: Course[] }) {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formChapterId, setFormChapterId] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state for content upload mode
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload')
  const [selectedTipo, setSelectedTipo] = useState<'pdf' | 'audio' | 'video'>('pdf')
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // New course modal
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [courseForm, setCourseForm] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
  })
  const [courseError, setCourseError] = useState('')
  const [savingCourse, setSavingCourse] = useState(false)

  // New chapter modal
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [chapterTargetCourse, setChapterTargetCourse] = useState<string | null>(
    null
  )
  const [chapterForm, setChapterForm] = useState({
    nombre: '',
    numero: 1,
    descripcion: '',
  })
  const [chapterError, setChapterError] = useState('')
  const [savingChapter, setSavingChapter] = useState(false)

  const handleExpandCourse = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null)
      setChapters([])
      setExpandedChapter(null)
      setContent([])
      return
    }
    setExpandedCourse(courseId)
    setExpandedChapter(null)
    setContent([])
    setLoadingChapters(true)
    const result = await getChapters(courseId)
    setChapters(result.chapters || [])
    setLoadingChapters(false)
  }

  const handleExpandChapter = async (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null)
      setContent([])
      return
    }
    setExpandedChapter(chapterId)
    setLoadingContent(true)
    const result = await getContent(chapterId)
    setContent(result.content || [])
    setLoadingContent(false)
  }

  const handleAddContent = (chapterId: string) => {
    setFormChapterId(chapterId)
    setUploadMode('upload')
    setSelectedTipo('pdf')
    setUploadedFileUrl('')
    setFormError('')
    setShowForm(true)
  }

  const handleCreateContent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')

    const form = new FormData(e.currentTarget)
    const tipo = selectedTipo
    const titulo = (form.get('titulo') as string)?.trim()
    const descripcion = (form.get('descripcion') as string)?.trim() || undefined

    // Get URL from either upload or manual input
    const archivoUrl = uploadMode === 'upload'
      ? uploadedFileUrl
      : (form.get('archivo_url') as string)?.trim()

    if (!titulo) {
      setFormError('El título es obligatorio')
      return
    }

    if (!archivoUrl) {
      setFormError(uploadMode === 'upload'
        ? 'Sube un archivo primero'
        : 'La URL del archivo es obligatoria'
      )
      return
    }

    setSubmitting(true)
    const result = await createContent({
      capitulo_id: formChapterId,
      tipo,
      titulo,
      descripcion,
      archivo_url: archivoUrl,
      duracion_segundos: Number(form.get('duracion')) || undefined,
      orden: Number(form.get('orden')) || 1,
    })

    if (result.success) {
      setShowForm(false)
      setUploadedFileUrl('')
      const updated = await getContent(formChapterId)
      setContent(updated.content || [])
      router.refresh()
    } else {
      setFormError(result.error || 'Error al crear contenido')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este contenido?')) return
    setDeleting(id)
    await deleteContent(id)
    setContent((prev) => prev.filter((c) => c.id !== id))
    setDeleting(null)
  }

  // ── Course creation ─────────────────────────────────────────────

  const openCourseForm = () => {
    setCourseForm({ nombre: '', slug: '', descripcion: '' })
    setCourseError('')
    setShowCourseForm(true)
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setCourseError('')
    setSavingCourse(true)

    const slug = courseForm.slug.trim() || slugify(courseForm.nombre)
    const result = await createCourse({
      nombre: courseForm.nombre,
      slug,
      descripcion: courseForm.descripcion,
    })

    if ('error' in result && result.error) {
      setCourseError(result.error)
    } else if ('success' in result && result.success && result.curso) {
      setCourses((prev) => [...prev, result.curso])
      setShowCourseForm(false)
      router.refresh()
    }
    setSavingCourse(false)
  }

  const handleDeleteCourse = async (course: Course) => {
    if (
      !confirm(
        `¿Eliminar el curso "${course.nombre}"? Esto borra también sus capítulos y contenido.`
      )
    ) {
      return
    }
    const result = await deleteCourse(course.id)
    if ('error' in result && result.error) {
      alert(result.error)
      return
    }
    setCourses((prev) => prev.filter((c) => c.id !== course.id))
    if (expandedCourse === course.id) {
      setExpandedCourse(null)
      setChapters([])
    }
    router.refresh()
  }

  // ── Chapter creation ────────────────────────────────────────────

  const openChapterForm = (courseId: string) => {
    // Pre-fill numero as next available
    const nextNum = chapters.length > 0
      ? Math.max(...chapters.map((c) => c.numero)) + 1
      : 1
    setChapterForm({ nombre: '', numero: nextNum, descripcion: '' })
    setChapterError('')
    setChapterTargetCourse(courseId)
    setShowChapterForm(true)
  }

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chapterTargetCourse) return
    setChapterError('')
    setSavingChapter(true)

    const result = await createChapter({
      curso_id: chapterTargetCourse,
      nombre: chapterForm.nombre,
      numero: chapterForm.numero,
      descripcion: chapterForm.descripcion || undefined,
    })

    if ('error' in result && result.error) {
      setChapterError(result.error)
    } else if ('success' in result && result.success && result.capitulo) {
      setChapters((prev) =>
        [...prev, result.capitulo].sort((a, b) => a.numero - b.numero)
      )
      setShowChapterForm(false)
      router.refresh()
    }
    setSavingChapter(false)
  }

  const handleDeleteChapter = async (chapterId: string, chapterName: string) => {
    if (
      !confirm(
        `¿Eliminar el capítulo "${chapterName}"? Esto borra también su contenido.`
      )
    ) {
      return
    }
    const result = await deleteChapter(chapterId)
    if ('error' in result && result.error) {
      alert(result.error)
      return
    }
    setChapters((prev) => prev.filter((c) => c.id !== chapterId))
    if (expandedChapter === chapterId) {
      setExpandedChapter(null)
      setContent([])
    }
    router.refresh()
  }

  // Build folder path for uploads: cursoSlug/capituloId
  const currentCourse = courses.find((c) => c.id === expandedCourse)
  const uploadFolder = currentCourse
    ? `${currentCourse.slug}/${formChapterId}`
    : 'general'

  return (
    <div className="space-y-3">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {courses.length} curso{courses.length === 1 ? '' : 's'} en total
        </p>
        <button
          onClick={openCourseForm}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
        >
          <BookPlus className="h-4 w-4" />
          Nuevo curso
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
          <p className="mb-3 text-neutral-500">Aún no hay cursos</p>
          <button
            onClick={openCourseForm}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
          >
            <BookPlus className="h-4 w-4" />
            Crear primer curso
          </button>
        </div>
      ) : (
        courses.map((course) => (
          <div
            key={course.id}
            className="rounded-2xl glass-card overflow-hidden"
          >
            <div className="flex items-center hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
              <button
                onClick={() => handleExpandCourse(course.id)}
                className="flex flex-1 items-center gap-3 px-5 py-4 text-left cursor-pointer"
              >
                {expandedCourse === course.id ? (
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                )}
                <BookOpen className="h-5 w-5 text-primary-400" />
                <span className="flex-1 font-semibold text-neutral-900 dark:text-white">
                  {course.nombre}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    course.activo
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-black/[0.03] dark:bg-white/5 text-neutral-500 border-black/10 dark:border-white/10'
                  }`}
                >
                  {course.activo ? 'Activo' : 'Inactivo'}
                </span>
              </button>
              <button
                onClick={() => handleDeleteCourse(course)}
                className="mr-3 rounded-lg p-2 text-neutral-500 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-900/30 transition-colors cursor-pointer"
                aria-label="Eliminar curso"
                title="Eliminar curso"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {expandedCourse === course.id && (
              <div className="border-t border-black/5 dark:border-white/5">
                {loadingChapters ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="mb-3 text-sm text-neutral-500">
                      Sin capítulos
                    </p>
                    <button
                      onClick={() => openChapterForm(course.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-500 hover:bg-primary-500/20 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Crear primer capítulo
                    </button>
                  </div>
                ) : (
                  chapters.map((ch) => (
                    <div key={ch.id} className="border-t border-black/[0.03] dark:border-white/[0.03]">
                      <div className="flex items-center hover:bg-black/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                        <button
                          onClick={() => handleExpandChapter(ch.id)}
                          className="flex flex-1 items-center gap-3 px-8 py-3 text-left cursor-pointer"
                        >
                          {expandedChapter === ch.id ? (
                            <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
                          )}
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            <span className="font-medium">Cap. {ch.numero}:</span>{' '}
                            {ch.nombre}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(ch.id, ch.nombre)}
                          className="mr-3 rounded-lg p-1.5 text-neutral-500 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-900/30 transition-colors cursor-pointer"
                          aria-label="Eliminar capítulo"
                          title="Eliminar capítulo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {expandedChapter === ch.id && (
                        <div className="bg-black/[0.01] dark:bg-white/[0.01] px-12 py-2">
                          {loadingContent ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                            </div>
                          ) : (
                            <>
                              {content.map((item) => {
                                const Icon = tipoIcons[item.tipo] || FileText
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-3 py-2"
                                  >
                                    <Icon className="h-4 w-4 text-neutral-500 shrink-0" />
                                    <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">
                                      {item.titulo}
                                    </span>
                                    <span className="text-xs text-neutral-500 uppercase">
                                      {item.tipo}
                                    </span>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      disabled={deleting === item.id}
                                      className="p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )
                              })}
                              {content.length === 0 && (
                                <p className="py-2 text-xs text-neutral-500">
                                  Sin contenido
                                </p>
                              )}
                              <button
                                onClick={() => handleAddContent(ch.id)}
                                className="mt-1 flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 cursor-pointer py-1"
                              >
                                <Plus className="h-3 w-3" />
                                Agregar contenido
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* "+ Nuevo capítulo" button at the bottom of the chapter list */}
                {!loadingChapters && chapters.length > 0 && (
                  <div className="border-t border-black/[0.03] dark:border-white/[0.03] px-8 py-3">
                    <button
                      onClick={() => openChapterForm(course.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 cursor-pointer"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      Nuevo capítulo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* ── New Course modal ───────────────────────────────────────── */}
      {showCourseForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowCourseForm(false)}
        >
          <form
            onSubmit={handleCreateCourse}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6 glass-card max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Nuevo curso
              </h3>
              <button
                type="button"
                onClick={() => setShowCourseForm(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Nombre del curso
                </label>
                <input
                  value={courseForm.nombre}
                  onChange={(e) => {
                    const nombre = e.target.value
                    setCourseForm((f) => ({
                      ...f,
                      nombre,
                      slug: f.slug || slugify(nombre),
                    }))
                  }}
                  required
                  placeholder="Ej: Plomería Residencial"
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Slug (URL)
                </label>
                <input
                  value={courseForm.slug}
                  onChange={(e) =>
                    setCourseForm((f) => ({
                      ...f,
                      slug: slugify(e.target.value),
                    }))
                  }
                  required
                  placeholder="plomeria-residencial"
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm font-mono text-xs"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  URL final: /estudio/{courseForm.slug || 'tu-slug'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Descripción
                </label>
                <textarea
                  value={courseForm.descripcion}
                  onChange={(e) =>
                    setCourseForm((f) => ({ ...f, descripcion: e.target.value }))
                  }
                  required
                  rows={3}
                  placeholder="¿De qué trata el curso? Qué va a aprender el estudiante..."
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {courseError && (
              <p className="mt-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-2.5 text-sm text-danger-600 dark:text-danger-400">
                {courseError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCourseForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingCourse}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer transition-colors disabled:opacity-50"
              >
                {savingCourse && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingCourse ? 'Creando...' : 'Crear curso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── New Chapter modal ──────────────────────────────────────── */}
      {showChapterForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowChapterForm(false)}
        >
          <form
            onSubmit={handleCreateChapter}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6 glass-card max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Nuevo capítulo
              </h3>
              <button
                type="button"
                onClick={() => setShowChapterForm(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Número
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={chapterForm.numero}
                    onChange={(e) =>
                      setChapterForm((f) => ({
                        ...f,
                        numero: parseInt(e.target.value) || 1,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Nombre del capítulo
                  </label>
                  <input
                    value={chapterForm.nombre}
                    onChange={(e) =>
                      setChapterForm((f) => ({ ...f, nombre: e.target.value }))
                    }
                    required
                    placeholder="Ej: Instalaciones eléctricas básicas"
                    className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Descripción{' '}
                  <span className="text-neutral-400">(opcional)</span>
                </label>
                <textarea
                  value={chapterForm.descripcion}
                  onChange={(e) =>
                    setChapterForm((f) => ({
                      ...f,
                      descripcion: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Breve resumen del capítulo..."
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {chapterError && (
              <p className="mt-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-2.5 text-sm text-danger-600 dark:text-danger-400">
                {chapterError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowChapterForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingChapter}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer transition-colors disabled:opacity-50"
              >
                {savingChapter && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingChapter ? 'Creando...' : 'Crear capítulo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add content modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateContent}
            className="w-full max-w-lg rounded-2xl p-6 glass-card max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              Agregar Contenido
            </h3>

            <div className="space-y-4">
              {/* Tipo selector */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Tipo de contenido
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(['pdf', 'audio', 'video'] as const).map((t) => {
                    const TIcon = tipoIcons[t] || FileText
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedTipo(t)
                          setUploadedFileUrl('')
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                          selectedTipo === t
                            ? 'bg-primary-600 text-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border border-black/10 dark:border-white/10'
                        }`}
                      >
                        <TIcon className="h-4 w-4" />
                        {t.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Título
                </label>
                <input
                  name="titulo"
                  required
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  placeholder="Ej: Guía Capítulo 1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Descripción <span className="text-neutral-400">(opcional)</span>
                </label>
                <input
                  name="descripcion"
                  className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  placeholder="Breve descripción del contenido..."
                />
              </div>

              {/* Upload mode toggle */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                  Archivo
                </label>
                <div className="flex rounded-xl border border-black/10 dark:border-white/10 overflow-hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      uploadMode === 'upload'
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Subir archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      uploadMode === 'url'
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Pegar URL
                  </button>
                </div>

                {uploadMode === 'upload' ? (
                  <FileUploader
                    tipo={selectedTipo}
                    folder={uploadFolder}
                    onUploadComplete={(url) => setUploadedFileUrl(url)}
                    currentUrl={uploadedFileUrl}
                  />
                ) : (
                  <input
                    name="archivo_url"
                    className="w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                    placeholder="https://storage.supabase.co/..."
                  />
                )}
              </div>

              {/* Duration + Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Duración <span className="text-neutral-400">(seg)</span>
                  </label>
                  <input
                    name="duracion"
                    type="number"
                    className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                    placeholder="3600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Orden
                  </label>
                  <input
                    name="orden"
                    type="number"
                    defaultValue={1}
                    className="mt-1 w-full rounded-xl glass-input px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <p className="mt-3 text-sm text-red-500">{formError}</p>
            )}

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setUploadedFileUrl('')
                  setFormError('')
                }}
                className="rounded-xl px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
