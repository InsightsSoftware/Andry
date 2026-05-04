'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { updateProgress } from '@/actions/estudio'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Search,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  ChevronLast,
  ChevronFirst,
} from 'lucide-react'

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFViewerProps {
  contenidoId: string
  archivoUrl: string
  initialProgress: number
}

export function PDFViewerClient({
  contenidoId,
  archivoUrl,
  initialProgress,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.25)           // ← 125% by default
  const [progress, setProgress] = useState(initialProgress)
  const [completed, setCompleted] = useState(initialProgress >= 95)
  const [saving, setSaving] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageInputValue, setPageInputValue] = useState('1')
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [pdfError, setPdfError] = useState(false)

  // Search navigation state
  const [matchIndex, setMatchIndex] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const marksRef = useRef<Element[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSavedProgress = useRef(initialProgress)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Page navigation (scroll-based) ───────────────────────────────
  const goToPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(numPages || 1, page))
      setCurrentPage(targetPage)
      setPageInputValue(String(targetPage))
      const el = scrollRef.current
      if (el && numPages > 0) {
        const scrollTarget = ((targetPage - 1) / numPages) * el.scrollHeight
        el.scrollTo({ top: scrollTarget, behavior: 'smooth' })
      }
    },
    [numPages]
  )

  // ── Scroll → progress + current page ─────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || numPages === 0) return
    const scrollPercent = Math.round(
      (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
    )
    const clampedPercent = Math.min(100, Math.max(0, scrollPercent))
    setProgress(clampedPercent)
    const estimatedPage = Math.max(
      1,
      Math.min(numPages, Math.ceil((clampedPercent / 100) * numPages))
    )
    setCurrentPage(estimatedPage)
    setPageInputValue(String(estimatedPage))
  }, [numPages])

  const progressPercent = numPages > 0
    ? Math.round((currentPage / numPages) * 100)
    : progress

  // Auto-save progress every ~10% change
  useEffect(() => {
    if (completed || numPages === 0) return
    const diff = progress - lastSavedProgress.current
    if (diff >= 10 || (progress >= 95 && !completed)) {
      lastSavedProgress.current = progress
      const doSave = async () => {
        setSaving(true)
        const result = await updateProgress(contenidoId, Math.min(100, progress))
        if (result.success && result.completado) setCompleted(true)
        setSaving(false)
      }
      doSave()
    }
  }, [progress, completed, contenidoId, numPages])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (progress > lastSavedProgress.current && !completed) {
        updateProgress(contenidoId, progress)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Search ────────────────────────────────────────────────────────
  const activateMatch = useCallback((marks: Element[], index: number) => {
    marks.forEach((m, i) => {
      const el = m as HTMLElement
      if (i === index) {
        el.style.backgroundColor = '#f97316'
        el.style.color = '#fff'
        el.style.outline = '2px solid #ea580c'
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      } else {
        el.style.backgroundColor = '#fbbf24'
        el.style.color = '#000'
        el.style.outline = 'none'
      }
    })
  }, [])

  const collectAndJump = useCallback(
    (attempt = 0) => {
      const marks = Array.from(scrollRef.current?.querySelectorAll('mark') ?? [])
      if (marks.length === 0 && attempt < 12) {
        setTimeout(() => collectAndJump(attempt + 1), 250)
        return
      }
      marksRef.current = marks
      setMatchCount(marks.length)
      setMatchIndex(0)
      if (marks.length > 0) activateMatch(marks, 0)
    },
    [activateMatch]
  )

  useEffect(() => {
    if (!searchText.trim()) {
      marksRef.current = []
      setMatchCount(0)
      setMatchIndex(0)
      return
    }
    const timer = setTimeout(() => collectAndJump(0), 400)
    return () => clearTimeout(timer)
  }, [searchText, collectAndJump])

  const navigateMatch = useCallback(
    (dir: 'next' | 'prev') => {
      const marks = marksRef.current
      if (marks.length === 0) return
      const newIndex =
        dir === 'next'
          ? (matchIndex + 1) % marks.length
          : (matchIndex - 1 + marks.length) % marks.length
      setMatchIndex(newIndex)
      activateMatch(marks, newIndex)
    },
    [matchIndex, activateMatch]
  )

  // ── On document load ──────────────────────────────────────────────
  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total)
      setLoadingDoc(false)
      if (initialProgress > 0 && total > 1) {
        const startPage = Math.max(1, Math.ceil((initialProgress / 100) * total))
        setCurrentPage(startPage)
        setPageInputValue(String(startPage))
        setTimeout(() => {
          const el = scrollRef.current
          if (el) {
            const scrollTarget = (startPage / total) * (el.scrollHeight - el.clientHeight)
            el.scrollTo({ top: scrollTarget, behavior: 'auto' })
          }
        }, 500)
      }
    },
    [initialProgress]
  )

  // ── Zoom ─────────────────────────────────────────────────────────
  const zoom = useCallback((dir: 'in' | 'out') => {
    setScale((s) => {
      if (dir === 'in') return Math.min(3, Math.round((s + 0.25) * 100) / 100)
      return Math.max(0.5, Math.round((s - 0.25) * 100) / 100)
    })
  }, [])

  // ── Fullscreen ────────────────────────────────────────────────────
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

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────
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
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPage, goToPage, zoom])

  // ── DRM-lite ──────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.id = '__pdf-drm'
    style.textContent = `
      .react-pdf__Page { -webkit-user-select: none !important; user-select: none !important; }
      .react-pdf__Page__textContent {
        -webkit-user-select: none !important;
        user-select: none !important;
        pointer-events: none !important;
      }
      .react-pdf__Page__textContent mark { pointer-events: none !important; }
      @media print { body { display: none !important; } }
    `
    document.head.appendChild(style)

    const blockKey = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey
      if (
        e.key === 'PrintScreen' ||
        (isCtrl && e.key === 'p') ||
        (isCtrl && e.key === 's') ||
        (isCtrl && e.key === 'a') ||
        (isCtrl && e.key === 'c' &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement))
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const blockContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.react-pdf__Page')) e.preventDefault()
    }

    const handleVisibility = () => {
      const pages = document.querySelectorAll<HTMLElement>('.react-pdf__Page')
      pages.forEach((p) => { p.style.filter = document.hidden ? 'blur(20px)' : '' })
    }

    window.addEventListener('keydown', blockKey, true)
    window.addEventListener('contextmenu', blockContext, true)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.getElementById('__pdf-drm')?.remove()
      window.removeEventListener('keydown', blockKey, true)
      window.removeEventListener('contextmenu', blockContext, true)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // ── Text renderer (search highlight) ─────────────────────────────
  const textRenderer = useMemo(
    () =>
      searchText
        ? (textItem: { str: string }) => highlightSearchText(textItem.str, searchText)
        : undefined,
    [searchText]
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

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 flex-col min-h-0 ${isFullscreen ? 'bg-neutral-950' : ''}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-2 mb-2 flex-wrap">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage <= 1}
            className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Primera página"
          >
            <ChevronFirst className="h-4 w-4" />
          </button>
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
          <button
            onClick={() => goToPage(numPages)}
            disabled={currentPage >= numPages}
            className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
            aria-label="Última página"
          >
            <ChevronLast className="h-4 w-4" />
          </button>
        </div>

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

        <div className="hidden sm:block h-5 w-px bg-neutral-300 dark:bg-neutral-600" />

        {/* Inline search */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (marksRef.current.length > 0) {
                    e.shiftKey ? navigateMatch('prev') : navigateMatch('next')
                  } else if (searchText.trim()) {
                    collectAndJump(0)
                  }
                } else if (e.key === 'Escape') {
                  setSearchText('')
                }
              }}
              placeholder="Buscar…"
              className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 pl-7 pr-2 py-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-500/30"
            />
          </div>

          {searchText && (
            <>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 min-w-[2.5rem] text-center">
                {matchCount === 0 ? '0' : `${matchIndex + 1}/${matchCount}`}
              </span>
              <button
                onClick={() => navigateMatch('prev')}
                disabled={matchCount === 0}
                className="rounded-lg p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateMatch('next')}
                disabled={matchCount === 0}
                className="rounded-lg p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSearchText('')}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="hidden sm:block h-5 w-px bg-neutral-300 dark:bg-neutral-600" />

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        <div className="flex-1" />

        {/* Progress + status */}
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500" />}
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

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 mb-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Floating search pill */}
      {searchText && matchCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-neutral-900/90 backdrop-blur-md px-4 py-2.5 shadow-2xl ring-1 ring-white/10">
            <Search className="h-3.5 w-3.5 text-primary-400 shrink-0" />
            <span className="text-xs text-neutral-300 max-w-[120px] truncate hidden sm:inline">
              {searchText}
            </span>
            <span className="text-xs font-semibold text-white min-w-[40px] text-center tabular-nums">
              {matchIndex + 1}/{matchCount}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => navigateMatch('prev')}
                disabled={matchCount === 0}
                className="rounded-full p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateMatch('next')}
                disabled={matchCount === 0}
                className="rounded-full p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <button
              onClick={() => setSearchText('')}
              className="rounded-full p-1 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Continuous-scroll PDF viewer ─────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-900 select-none"
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
                  <div
                    className="flex items-center justify-center bg-white dark:bg-neutral-800 rounded-sm shadow-lg"
                    style={{ width: 595 * scale, height: 842 * scale }}
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  </div>
                }
                customTextRenderer={textRenderer}
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
