'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Headphones, Video, Loader2, CheckCircle2 } from 'lucide-react'

interface FileUploaderProps {
  tipo: 'pdf' | 'audio' | 'video'
  folder?: string
  onUploadComplete: (url: string) => void
  currentUrl?: string
}

const ACCEPT_MAP: Record<string, string> = {
  pdf: '.pdf',
  audio: '.mp3,.wav,.ogg,.aac,.m4a',
  video: '.mp4,.webm,.mov,.avi',
}

const MAX_SIZE_MAP: Record<string, number> = {
  pdf: 100,   // MB
  audio: 300,
  video: 500,
}

const ICON_MAP: Record<string, typeof FileText> = {
  pdf: FileText,
  audio: Headphones,
  video: Video,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUploader({ tipo, folder = 'general', onUploadComplete, currentUrl }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl || '')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const Icon = ICON_MAP[tipo] || FileText
  const maxSizeMB = MAX_SIZE_MAP[tipo] || 100

  const handleUpload = useCallback(async (file: File) => {
    setError('')
    setProgress(0)

    // Client-side validation
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setError(`El archivo es demasiado grande. Máximo: ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', tipo)
      formData.append('folder', folder)

      // Use XMLHttpRequest for progress tracking
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText)
            if (data.success) {
              resolve(data.url)
            } else {
              reject(new Error(data.error || 'Error al subir'))
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              reject(new Error(data.error || `Error ${xhr.status}`))
            } catch {
              reject(new Error(`Error ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Error de red')))
        xhr.addEventListener('abort', () => reject(new Error('Subida cancelada')))

        xhr.open('POST', '/api/admin/upload')
        xhr.send(formData)
      })

      setUploadedUrl(url)
      setProgress(100)
      onUploadComplete(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }, [tipo, folder, maxSizeMB, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }, [handleUpload])

  const handleClear = useCallback(() => {
    setUploadedUrl('')
    setFileName('')
    setProgress(0)
    setError('')
    onUploadComplete('')
  }, [onUploadComplete])

  // Already uploaded state
  if (uploadedUrl && !uploading) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate">
              {fileName || 'Archivo subido'}
            </p>
            <p className="text-xs text-neutral-500 truncate">{uploadedUrl}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Uploading state
  if (uploading) {
    return (
      <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
              Subiendo {fileName}...
            </p>
            <p className="text-xs text-neutral-500">{progress}%</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  // Drop zone state
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-black/10 dark:border-white/10 hover:border-primary-500/50 hover:bg-primary-500/5'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[tipo]}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`rounded-full p-2 ${isDragging ? 'bg-primary-500/20' : 'bg-black/[0.03] dark:bg-white/[0.05]'}`}>
            {isDragging
              ? <Upload className="h-5 w-5 text-primary-500" />
              : <Icon className="h-5 w-5 text-neutral-400" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo o haz click'}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {tipo.toUpperCase()} hasta {maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
