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
} from 'lucide-react'
import {
  getChapters,
  getContent,
  createContent,
  deleteContent,
} from '@/actions/admin'

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

export function ContentManager({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formChapterId, setFormChapterId] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

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
    setShowForm(true)
  }

  const handleCreateContent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const result = await createContent({
      capitulo_id: formChapterId,
      tipo: form.get('tipo') as 'pdf' | 'audio' | 'video',
      titulo: form.get('titulo') as string,
      descripcion: (form.get('descripcion') as string) || undefined,
      archivo_url: form.get('archivo_url') as string,
      duracion_segundos: Number(form.get('duracion')) || undefined,
      orden: Number(form.get('orden')) || 1,
    })

    if (result.success) {
      setShowForm(false)
      // Refresh chapter content
      const updated = await getContent(formChapterId)
      setContent(updated.content || [])
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este contenido?')) return
    setDeleting(id)
    await deleteContent(id)
    setContent((prev) => prev.filter((c) => c.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-3">
      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            No hay cursos creados
          </p>
        </div>
      ) : (
        courses.map((course) => (
          <div
            key={course.id}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden"
          >
            {/* Course header */}
            <button
              onClick={() => handleExpandCourse(course.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
            >
              {expandedCourse === course.id ? (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              )}
              <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="flex-1 text-left font-semibold text-neutral-900 dark:text-neutral-100">
                {course.nombre}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  course.activo
                    ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {course.activo ? 'Activo' : 'Inactivo'}
              </span>
            </button>

            {/* Chapters */}
            {expandedCourse === course.id && (
              <div className="border-t border-neutral-100 dark:border-neutral-800">
                {loadingChapters ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  </div>
                ) : chapters.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-neutral-400 dark:text-neutral-500">
                    Sin capítulos
                  </p>
                ) : (
                  chapters.map((ch) => (
                    <div
                      key={ch.id}
                      className="border-t border-neutral-50 dark:border-neutral-800/50"
                    >
                      <button
                        onClick={() => handleExpandChapter(ch.id)}
                        className="w-full flex items-center gap-3 px-8 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                      >
                        {expandedChapter === ch.id ? (
                          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                        )}
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          <span className="font-medium">Cap. {ch.numero}:</span>{' '}
                          {ch.nombre}
                        </span>
                      </button>

                      {/* Content items */}
                      {expandedChapter === ch.id && (
                        <div className="bg-neutral-50/50 dark:bg-neutral-800/20 px-12 py-2">
                          {loadingContent ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                            </div>
                          ) : (
                            <>
                              {content.map((item) => {
                                const Icon =
                                  tipoIcons[item.tipo] || FileText
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-3 py-2"
                                  >
                                    <Icon className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                                    <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">
                                      {item.titulo}
                                    </span>
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500 uppercase">
                                      {item.tipo}
                                    </span>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      disabled={deleting === item.id}
                                      className="p-1 text-neutral-400 hover:text-danger-500 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )
                              })}
                              {content.length === 0 && (
                                <p className="py-2 text-xs text-neutral-400 dark:text-neutral-500">
                                  Sin contenido
                                </p>
                              )}
                              <button
                                onClick={() => handleAddContent(ch.id)}
                                className="mt-1 flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer py-1"
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
              </div>
            )}
          </div>
        ))
      )}

      {/* Add content modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleCreateContent}
            className="mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Agregar Contenido
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Tipo
                </label>
                <select
                  name="tipo"
                  required
                  className="mt-1 w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                >
                  <option value="pdf">PDF</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Título
                </label>
                <input
                  name="titulo"
                  required
                  className="mt-1 w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  placeholder="Guía Capítulo 1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Descripción (opcional)
                </label>
                <input
                  name="descripcion"
                  className="mt-1 w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  placeholder="Breve descripción..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  URL del archivo
                </label>
                <input
                  name="archivo_url"
                  required
                  className="mt-1 w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  placeholder="https://storage.supabase.co/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Duración (seg)
                  </label>
                  <input
                    name="duracion"
                    type="number"
                    className="mt-1 w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
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
                    className="mt-1 w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-600 dark:bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 dark:hover:bg-primary-600 cursor-pointer"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
