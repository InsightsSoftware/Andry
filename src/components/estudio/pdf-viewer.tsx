'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { updateProgress } from '@/actions/estudio'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  X,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react'

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFViewerProps {
  contenidoId: string
  archivoUrl: string
  initialProgress: number
}

export function PDFViewer({
  contenidoId,
  archivoUrl,
  initialProgress,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [progress, setProgress] = useState(initialProgress)
  const [completed, setCompleted] = useState(initialProgress >= 95)
  const [saving, setSaving] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageInputValue, setPageInputValue] = useState('1')
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [pdfError, setPdfError] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSavedProgress = useRef(initialProgress)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Track scroll-based progress
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || numPages === 0) return

    const scrollPercent = Math.round(
      (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
    )
    const clampedPercent = Math.min(100, Math.max(0, scrollPercent))

    setProgress(clampedPercent)

    // Estimate current page from scroll position
    const estimatedPage = Math.max(
      1,
      Math.min(numPages, Math.ceil((clampedPercent / 100) * numPages))
    )
    setCurrentPage(estimatedPage)
    setPageInputValue(String(estimatedPage))
  }, [numPages])

  // Auto-save progress every 10% change
  useEffect(() => {
    if (completed) return
    const diff = progress - lastSavedProgress.current
    if (diff >= 10 || (progress >= 95 && !completed)) {
      lastSavedProgress.current = progress
      const saveProgress = async () => {
        setSaving(true)
        const result = await updateProgress(
          contenidoId,
          Math.min(100, progress)
        )
        if (result.success && result.completado) {
          setCompleted(true)
        }
        setSaving(false)
      }
      saveProgress()
    }
  }, [progress, completed, contenidoId])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (progress > lastSavedProgress.current && !completed) {
        updateProgress(contenidoId, progress)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total)
      setLoadingDoc(false)
      // Jump to approximate page based on saved progress
      if (initialProgress > 0 && total > 1) {
        const startPage = Math.max(
          1,
          Math.ceil((initialProgress / 100) * total)
        )
        setCurrentPage(startPage)
        setPageInputValue(String(startPage))
        // Scroll to that page after render
        setTimeout(() => {
          const el = scrollRef.current
          if (el) {
            const scrollTarget =
              (startPage / total) * (el.scrollHeight - el.clientHeight)
            el.scrollTo({ top: scrollTarget, behavior: 'auto' })
          }
        }, 500)
      }
    },
    [initialProgress]
  )

  const goToPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(numPages, page))
      setCurrentPage(targetPage)
      setPageInputValue(String(targetPage))

      // Scroll to page
      const el = scrollRef.current
      if (el && numPages > 0) {
        const scrollTarget =
          ((targetPage - 1) / numPages) * el.scrollHeight
        el.scrollTo({ top: scrollTarget, behavior: 'smooth' })
      }
    },
    [numPages]
  )

  const handlePageInput = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const page = parseInt(pageInputValue)
        if (!isNaN(page)) goToPage(page)
      }
    },
    [pageInputValue, goToPage]
  )

  const zoom = useCallback(
    (dir: 'in' | 'out') => {
      setScale((s) => {
        if (dir === 'in') return Math.min(3, s + 0.25)
        return Math.max(0.5, s - 0.25)
      })
    },
    []
  )

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Listen for fullscreen exit via Esc
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Focus search input
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        goToPage(currentPage + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        goToPage(currentPage - 1)
      } else if (e.key === '+' || e.key === '=') {
        zoom('in')
      } else if (e.key === '-') {
        zoom('out')
      } else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch((s) => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPage, goToPage, zoom])

  const progressPercent = numPages > 0 ? Math.round((currentPage / numPages) * 100) : progress

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 flex-col ${isFullscreen ? 'bg-neutral-950' : ''}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-2 mb-2 flex-wrap">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 text-sm">
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onKeyDown={handlePageInput}
              onBlur={() => {
                const p = parseInt(pageInputValue)
                if (!isNaN(p)) goToPage(p)
              }}
              className="w-10 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-center text-sm py-0.5 text-neutral-900 dark:text-neutral-100"
              aria-label="Página actual"
            />
            <span className="text-neutral-500 dark:text-neutral-400">
              / {numPages || '...'}
            </span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-neutral-300 dark:bg-neutral-600" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoom('out')}
            disabled={scale <= 0.5}
            className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Reducir zoom"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => zoom('in')}
            disabled={scale >= 3}
            className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-neutral-300 dark:bg-neutral-600" />

        {/* Search toggle */}
        <button
          onClick={() => setShowSearch((s) => !s)}
          className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
            showSearch
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Progress + status */}
        <div className="flex items-center gap-2">
          {saving && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500" />
          )}
          {completed ? (
            <div className="flex items-center gap-1 text-success-600 dark:text-success-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">Completado</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              {progressPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-2 mb-2">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar en el documento..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
          />
          <button
            onClick={() => {
              setSearchText('')
              setShowSearch(false)
            }}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 mb-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* PDF Document */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-900"
        style={{ minHeight: '500px' }}
      >
        {pdfError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
              <X className="h-8 w-8 text-danger-500" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                No se pudo cargar el PDF
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Puede ser un problema de conexión o el archivo no está disponible.
              </p>
              <a
                href={archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                Abrir PDF directamente
              </a>
            </div>
          </div>
        ) : (
          <Document
            file={archivoUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setPdfError(true)}
            loading={
              <div className="flex flex-col items-center justify-center h-[500px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Cargando documento...
                </p>
              </div>
            }
            className="flex flex-col items-center gap-2 py-4"
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={`page_${i + 1}`}
                pageNumber={i + 1}
                scale={scale}
                className="shadow-lg rounded-sm"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center bg-white dark:bg-neutral-800 rounded-sm shadow-lg" style={{ width: 595 * scale, height: 842 * scale }}>
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  </div>
                }
                customTextRenderer={
                  searchText
                    ? (textItem) =>
                        highlightSearchText(textItem.str, searchText)
                    : undefined
                }
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  )
}

/** Highlight matching text in PDF text layer */
function highlightSearchText(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(
    regex,
    '<mark style="background-color: #fbbf24; color: #000; padding: 1px 2px; border-radius: 2px;">$1</mark>'
  )
}
