'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FolderOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Folder,
  FileAudio,
  FileVideo,
  FileText,
  ChevronRight,
  Play,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createChapter, createContent } from '@/actions/admin'

type Tipo = 'audio' | 'video' | 'pdf' | 'mixed'
type ResolvedTipo = 'audio' | 'video' | 'pdf'

export interface ExistingCapitulo {
  id: string
  curso_id: string
  numero: number
  nombre: string
}

export interface ExistingCurso {
  id: string
  nombre: string
  slug: string
}

interface Props {
  tipo: Tipo
  capitulos: ExistingCapitulo[]
  cursos: ExistingCurso[]
}

interface FileWithPath {
  file: File
  path: string
}

interface ParsedFile {
  file: File
  relativePath: string
  chapterNumber: number | null
  moduleNumber: number | null
  isComplete: boolean // "Cap N completo" subfolder
  suggestedTitle: string
  orden: number
  /** Resolved content type — detected per-file when parent is 'mixed',
   * inherited from parent tipo otherwise. */
  tipo: ResolvedTipo
}

interface ChapterPlan {
  numero: number
  nombre: string
  existsId: string | null // null = will be created
  cursoId: string
  files: ParsedFile[]
}

interface UploadResult {
  file: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg']
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi']
const PDF_EXTS = ['.pdf']

const ACCEPT_EXT: Record<Tipo, string[]> = {
  audio: AUDIO_EXTS,
  video: VIDEO_EXTS,
  pdf: PDF_EXTS,
  mixed: [...AUDIO_EXTS, ...VIDEO_EXTS, ...PDF_EXTS],
}

const TIPO_ICON: Record<ResolvedTipo, typeof FileAudio> = {
  audio: FileAudio,
  video: FileVideo,
  pdf: FileText,
}

const TIPO_LABEL: Record<ResolvedTipo, string> = {
  audio: 'Audio',
  video: 'Video',
  pdf: 'PDF',
}

const TIPO_ACCENT: Record<ResolvedTipo, string> = {
  audio: 'text-primary-500 bg-primary-500/10',
  video: 'text-success-500 bg-success-500/10',
  pdf: 'text-danger-500 bg-danger-500/10',
}

function detectTipoFromExt(filename: string): ResolvedTipo | null {
  const lower = filename.toLowerCase()
  if (AUDIO_EXTS.some((e) => lower.endsWith(e))) return 'audio'
  if (VIDEO_EXTS.some((e) => lower.endsWith(e))) return 'video'
  if (PDF_EXTS.some((e) => lower.endsWith(e))) return 'pdf'
  return null
}

// Oficial names from Andry's study guide — kept in sync with
// scripts/rename-chapters.mjs (DB migration) and OFFICIAL_CHAPTER_NAMES
// in src/lib/chapters.ts (used by /estudio to render the grid).
const CHAPTER_DEFAULTS: Record<number, string> = {
  1: 'Planificación y Organización del Negocio',
  2: 'Licencias',
  3: 'Gestión Financiera',
  4: 'Gestión de Riesgo',
  5: 'Leyes Laborales y Regulaciones de Empleo',
  6: 'Compensación Laboral',
  7: 'Seguridad OSHA',
  8: 'Contratos de Construcción y Responsabilidad',
  9: 'Ley de Gravámenes de Construcción',
  10: 'Gestión de Proyectos',
  11: 'Suplemento AIA',
  12: 'Suplemento Circular E',
}

// ── Parsing helpers ─────────────────────────────────────────────────

/**
 * Lowercase + strip diacritics. Necessary because macOS/zip extraction
 * can emit filenames in Unicode NFD form where 'í' is 'i' + U+0301
 * (combining acute) — two codepoints, not the single U+00ED. Plain
 * /[íi]/ regex only matches the single-codepoint form.
 */
function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks
    .toLowerCase()
    .trim()
}

function parseChapterFromFolder(folderName: string): {
  numero: number | null
  suggestedName: string
} {
  const raw = folderName.trim()
  const lower = normalizeForMatch(raw.replace(/[🎧📁📂]/g, ''))

  // After accent stripping: "cap 1", "cap-01", "capitulo 1", "capitulos 1"
  // all share base "cap" + optional "itulo(s)" + separators + digits.
  const capMatch = lower.match(/^cap(?:itulos?)?[\s_-]*(\d+)/)
  if (capMatch) {
    const n = parseInt(capMatch[1], 10)
    return { numero: n, suggestedName: CHAPTER_DEFAULTS[n] || `Capítulo ${n}` }
  }

  // Simple "N something" prefix (e.g. "1 audio", "02 - intro")
  const numMatch = lower.match(/^(\d+)[\s_-]/)
  if (numMatch) {
    const n = parseInt(numMatch[1], 10)
    return { numero: n, suggestedName: CHAPTER_DEFAULTS[n] || `Capítulo ${n}` }
  }

  // Known supplementaries (also accent-insensitive)
  if (lower.includes('aia')) return { numero: 11, suggestedName: CHAPTER_DEFAULTS[11] }
  if (lower.includes('circular')) return { numero: 12, suggestedName: CHAPTER_DEFAULTS[12] }
  if (lower.includes('suplementario') || lower.includes('suplemento')) {
    if (lower.includes('aia')) return { numero: 11, suggestedName: CHAPTER_DEFAULTS[11] }
    if (lower.includes('circular')) return { numero: 12, suggestedName: CHAPTER_DEFAULTS[12] }
  }

  return { numero: null, suggestedName: raw }
}

/**
 * Fallback when there's no folder prefix — extract chapter from the filename
 * itself. Handles:
 *   cap-01-mod-02.mp3, cap_01_mod_01.mp3, cap01-mod01.mp3     → 1
 *   Capítulo 1.pdf, capitulo 10.pdf, Capítulo 3 guía.pdf       → 1/10/3
 *   supp-aia-*, aia.pdf, aia-mod-a-01.mp3                      → 11
 *   supp-circular-e-*, Circular E.pdf                          → 12
 */
function parseChapterFromFilename(filename: string): {
  numero: number | null
  suggestedName: string
} {
  const base = normalizeForMatch(filename.replace(/\.[^.]+$/, ''))

  // "cap" or "capitulo/capitulos" (accent-stripped) then digits
  const m = base.match(/^cap(?:itulos?)?[\s_-]*(\d+)/)
  if (m) {
    const n = parseInt(m[1], 10)
    return { numero: n, suggestedName: CHAPTER_DEFAULTS[n] || `Capítulo ${n}` }
  }

  // Supplementary AIA
  if (base.includes('aia')) {
    return { numero: 11, suggestedName: CHAPTER_DEFAULTS[11] }
  }

  // Supplementary Circular E
  if (base.includes('circular')) {
    return { numero: 12, suggestedName: CHAPTER_DEFAULTS[12] }
  }

  return { numero: null, suggestedName: filename }
}

function parseModuleFromFilename(filename: string): {
  moduleNumber: number | null
  isComplete: boolean
  suggestedTitle: string
} {
  const base = normalizeForMatch(filename.replace(/\.[^.]+$/, ''))

  // "cap-NN-full" / "cap NN full" / "capitulo N completo"
  if (/full|completo/.test(base)) {
    const capMatch = base.match(/cap(?:itulos?)?[\s_-]*(\d+)/)
    const n = capMatch ? parseInt(capMatch[1], 10) : null
    return {
      moduleNumber: null,
      isComplete: true,
      suggestedTitle: n ? `Capítulo ${n} — Completo` : 'Completo',
    }
  }

  // Supplementary AIA with letter+number: "supp-aia-mod-a-01" →
  // Módulo A parte 1. Compose orden = letter_ordinal*100 + num so
  // items sort A-01, A-02, A-07, B-02, C-01 naturally.
  const aiaLetterMatch = base.match(/supp[\s_-]*aia[\s_-]*mod[\s_-]*([a-z])[\s_-]*(\d+)/)
  if (aiaLetterMatch) {
    const letter = aiaLetterMatch[1].toUpperCase()
    const num = parseInt(aiaLetterMatch[2], 10)
    const letterOrd = letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1
    return {
      moduleNumber: letterOrd * 100 + num,
      isComplete: false,
      suggestedTitle: `AIA — Módulo ${letter}, parte ${num}`,
    }
  }

  // AIA final module — deterministic last slot
  if (/supp[\s_-]*aia[\s_-]*mod[\s_-]*final/.test(base)) {
    return {
      moduleNumber: 9999,
      isComplete: false,
      suggestedTitle: 'AIA — Módulo Final',
    }
  }

  // Circular E section: "supp-circular-e-mod-s-NN"
  const circularMatch = base.match(/supp[\s_-]*circular[\s_-]*e[\s_-]*mod[\s_-]*s[\s_-]*(\d+)/)
  if (circularMatch) {
    const num = parseInt(circularMatch[1], 10)
    return {
      moduleNumber: num,
      isComplete: false,
      suggestedTitle: `Circular E — Sección ${num}`,
    }
  }

  // "cap-NN-mod-MM"
  const modMatch = base.match(/mod[\s_-]*(\d+)/)
  if (modMatch) {
    const m = parseInt(modMatch[1], 10)
    return {
      moduleNumber: m,
      isComplete: false,
      suggestedTitle: `Módulo ${m}`,
    }
  }

  // Bare "Capítulo N" / "Cap N" — typical for single-PDF-per-chapter
  // study guides. Treat as the main item for the chapter.
  const capAloneMatch = base.match(/^cap(?:itulos?)?[\s_-]*(\d+)\s*$/)
  if (capAloneMatch) {
    const n = parseInt(capAloneMatch[1], 10)
    return {
      moduleNumber: null,
      isComplete: true,
      suggestedTitle: `Capítulo ${n}`,
    }
  }

  // Known supplementaries as single docs
  if (/^aia\s*$/.test(base)) {
    return { moduleNumber: null, isComplete: true, suggestedTitle: 'AIA — Documento' }
  }
  if (/^circular[\s_-]*e?\s*$/.test(base)) {
    return { moduleNumber: null, isComplete: true, suggestedTitle: 'Circular E' }
  }

  // Fallback: clean up the filename for display (keep original accents)
  return {
    moduleNumber: null,
    isComplete: false,
    suggestedTitle: filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
  }
}

function isAcceptedFile(filename: string, tipo: Tipo): boolean {
  const lower = filename.toLowerCase()
  return ACCEPT_EXT[tipo].some((ext) => lower.endsWith(ext))
}

/**
 * Takes a list of { file, path } and produces a plan organized by chapter.
 * Non-matching files are skipped.
 */
function buildPlan(
  entries: FileWithPath[],
  tipo: Tipo,
  existingCapitulos: ExistingCapitulo[],
  defaultCursoId: string
): { plan: ChapterPlan[]; unknownPaths: string[] } {
  const capMap = new Map<number, ExistingCapitulo>()
  for (const c of existingCapitulos) capMap.set(c.numero, c)

  const byChapter = new Map<number, ParsedFile[]>()
  const unknownPaths: string[] = []

  for (const { file, path } of entries) {
    const relativePath = path || file.name
    if (!isAcceptedFile(file.name, tipo)) continue

    // Resolve file-level tipo. In 'mixed' mode each file declares its own
    // tipo via extension; otherwise inherit the parent tipo.
    const fileTipo: ResolvedTipo | null =
      tipo === 'mixed' ? detectTipoFromExt(file.name) : tipo
    if (!fileTipo) continue

    const parts = relativePath.split('/').filter(Boolean)
    // First segment = root folder user picked (e.g. "audios")
    // Second segment = chapter folder (e.g. "cap 1 audio")
    // Later segments = nested (e.g. "Cap 1 completo" subfolder)

    // Find the first segment that looks like a chapter folder
    let chapterNumber: number | null = null
    let chapterFolderIdx = -1
    for (let i = 0; i < parts.length - 1; i++) {
      const parsed = parseChapterFromFolder(parts[i])
      if (parsed.numero !== null) {
        chapterNumber = parsed.numero
        chapterFolderIdx = i
        break
      }
    }

    // Fallback: no chapter folder? Extract from the filename itself —
    // common when the user drops loose files instead of a folder tree.
    if (chapterNumber === null) {
      const fromName = parseChapterFromFilename(file.name)
      if (fromName.numero !== null) {
        chapterNumber = fromName.numero
      }
    }

    // Check if file is inside a "Cap N completo" subfolder
    let isComplete = false
    if (chapterFolderIdx >= 0) {
      for (let i = chapterFolderIdx + 1; i < parts.length - 1; i++) {
        if (/completo|full/i.test(parts[i])) {
          isComplete = true
          break
        }
      }
    }

    const { moduleNumber, isComplete: fileIsComplete, suggestedTitle } =
      parseModuleFromFilename(file.name)

    const effectiveIsComplete = isComplete || fileIsComplete
    const effectiveTitle = effectiveIsComplete && chapterNumber
      ? `Capítulo ${chapterNumber} — Completo`
      : suggestedTitle

    const orden = effectiveIsComplete
      ? 0
      : moduleNumber !== null
        ? moduleNumber
        : 999

    const parsedFile: ParsedFile = {
      file,
      relativePath,
      chapterNumber,
      moduleNumber,
      isComplete: effectiveIsComplete,
      suggestedTitle: effectiveTitle,
      orden,
      tipo: fileTipo,
    }

    if (chapterNumber !== null) {
      const arr = byChapter.get(chapterNumber) ?? []
      arr.push(parsedFile)
      byChapter.set(chapterNumber, arr)
    } else {
      unknownPaths.push(relativePath)
    }
  }

  // Sort files within each chapter for PREVIEW display only (completo
  // first, then by module number, then alphabetical).
  //
  // IMPORTANT: we DO NOT re-number orden here. The parser already assigned
  // orden = moduleNumber (e.g. 'cap-01-mod-02' → orden 2), which stays
  // stable across multiple bulk uploads. Re-numbering locally would make
  // new uploads reuse low numbers that conflict with existing DB rows —
  // that was the ordering bug.
  for (const arr of byChapter.values()) {
    arr.sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1
      if (a.orden !== b.orden) return a.orden - b.orden
      return a.file.name.localeCompare(b.file.name)
    })
  }

  // Build final plan
  const plan: ChapterPlan[] = []
  const sortedNumbers = Array.from(byChapter.keys()).sort((a, b) => a - b)
  for (const n of sortedNumbers) {
    const existing = capMap.get(n)
    plan.push({
      numero: n,
      nombre: existing?.nombre || CHAPTER_DEFAULTS[n] || `Capítulo ${n}`,
      existsId: existing?.id ?? null,
      cursoId: existing?.curso_id ?? defaultCursoId,
      files: byChapter.get(n)!,
    })
  }

  return { plan, unknownPaths }
}

// ── Upload helpers ──────────────────────────────────────────────────

async function uploadSingleFile(
  file: File,
  tipo: ResolvedTipo,
  folder: string
): Promise<{ path: string } | { error: string }> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('tipo', tipo)
  fd.append('folder', folder)

  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.success) {
    return { error: data?.error || `HTTP ${res.status}` }
  }
  return { path: data.path as string }
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, i: number) => Promise<void>
): Promise<void> {
  let idx = 0
  async function run() {
    while (idx < items.length) {
      const i = idx++
      await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => run()))
}

// ── Component ───────────────────────────────────────────────────────

export function BulkFolderUpload({ tipo, capitulos, cursos }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [plan, setPlan] = useState<ChapterPlan[] | null>(null)
  const [unknownCount, setUnknownCount] = useState(0)
  const [unknownPaths, setUnknownPaths] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 })
  const [statuses, setStatuses] = useState<UploadResult[]>([])
  const [finalSummary, setFinalSummary] = useState<string | null>(null)

  // Icon for the empty-dropzone state — pick a sensible default for 'mixed'
  const HeaderIcon = tipo === 'mixed' ? FolderOpen : TIPO_ICON[tipo]

  // Default curso — first one (usually "negocios-y-finanzas")
  const defaultCursoId = useMemo(() => cursos[0]?.id ?? '', [cursos])

  const processEntries = useCallback(
    (entries: FileWithPath[]) => {
      setFinalSummary(null)
      const { plan: built, unknownPaths: paths } = buildPlan(
        entries,
        tipo,
        capitulos,
        defaultCursoId
      )
      const acceptedCount = built.reduce((acc, p) => acc + p.files.length, 0)
      const totalAccepted = entries.filter((e) =>
        isAcceptedFile(e.file.name, tipo)
      ).length
      setUnknownCount(totalAccepted - acceptedCount)
      setUnknownPaths(paths)
      setPlan(built)
    },
    [tipo, capitulos, defaultCursoId]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const items = e.dataTransfer.items
      if (!items?.length) return

      // Walk FileSystem entries and collect { file, path } pairs
      const collected: FileWithPath[] = []
      await Promise.all(
        Array.from(items).map((item) => {
          const entry = (item as DataTransferItem & {
            webkitGetAsEntry?: () => FileSystemEntry | null
          }).webkitGetAsEntry?.()
          if (!entry) return Promise.resolve()
          return walkEntry(entry, '').then((fs) => collected.push(...fs))
        })
      )

      if (collected.length === 0) {
        // Fallback: plain drop without folder structure
        const plain = Array.from(e.dataTransfer.files || [])
        processEntries(plain.map((f) => ({ file: f, path: f.name })))
        return
      }

      processEntries(collected)
    },
    [processEntries]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return
      const arr = Array.from(e.target.files).map((f) => ({
        file: f,
        // <input webkitdirectory> sets webkitRelativePath natively
        path:
          (f as File & { webkitRelativePath?: string }).webkitRelativePath ||
          f.name,
      }))
      processEntries(arr)
      e.target.value = ''
    },
    [processEntries]
  )

  async function confirmUpload() {
    if (!plan) return
    setUploading(true)
    setFinalSummary(null)

    const flatTasks: { file: ParsedFile; chapter: ChapterPlan }[] = []
    for (const ch of plan) {
      for (const f of ch.files) flatTasks.push({ file: f, chapter: ch })
    }

    setStatuses(
      flatTasks.map((t) => ({ file: t.file.relativePath, status: 'pending' }))
    )
    setProgress({ done: 0, total: flatTasks.length, errors: 0 })

    // First, ensure all capítulos exist (sequential, avoids race)
    const ensuredCapituloIds = new Map<number, string>()
    for (const ch of plan) {
      if (ch.existsId) {
        ensuredCapituloIds.set(ch.numero, ch.existsId)
      } else {
        const res = await createChapter({
          curso_id: ch.cursoId,
          numero: ch.numero,
          nombre: ch.nombre,
        })
        if ('error' in res && res.error) {
          setFinalSummary(`Error creando capítulo ${ch.numero}: ${res.error}`)
          setUploading(false)
          return
        }
        if ('success' in res && res.success && res.capitulo) {
          ensuredCapituloIds.set(ch.numero, res.capitulo.id)
        }
      }
    }

    // Upload + create contenido SEQUENTIALLY. Large files (10-25MB PDFs,
    // 300MB videos) can saturate Render's egress when run in parallel and
    // cause intermittent 500s. Sequential keeps memory + bandwidth
    // predictable. Small audios still fly fast (~1-2s each).
    let doneCount = 0
    let errorCount = 0

    await runWithConcurrency(flatTasks, 1, async (task, i) => {
      setStatuses((prev) => {
        const next = [...prev]
        next[i] = { ...next[i], status: 'uploading' }
        return next
      })

      const capituloId = ensuredCapituloIds.get(task.chapter.numero)
      if (!capituloId) {
        setStatuses((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'error', error: 'Sin capítulo' }
          return next
        })
        errorCount++
        setProgress({ done: ++doneCount, total: flatTasks.length, errors: errorCount })
        return
      }

      // Build storage folder path: cursoSlug/capitulo-NN/[tipo]/
      // Adding the tipo subfolder so mixed uploads don't collide if an
      // audio and a pdf happen to share a base filename.
      const curso = cursos.find((c) => c.id === task.chapter.cursoId)
      const capFolder = `capitulo-${String(task.chapter.numero).padStart(2, '0')}`
      const folder = curso
        ? `${curso.slug}/${capFolder}/${task.file.tipo}`
        : `general/${capFolder}/${task.file.tipo}`

      const up = await uploadSingleFile(task.file.file, task.file.tipo, folder)
      if ('error' in up) {
        setStatuses((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'error', error: up.error }
          return next
        })
        errorCount++
        setProgress({ done: ++doneCount, total: flatTasks.length, errors: errorCount })
        return
      }

      const res = await createContent({
        capitulo_id: capituloId,
        tipo: task.file.tipo,
        titulo: task.file.suggestedTitle,
        archivo_url: up.path,
        orden: task.file.orden,
      })

      if ('error' in res && res.error) {
        setStatuses((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'error', error: res.error }
          return next
        })
        errorCount++
      } else {
        setStatuses((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'done' }
          return next
        })
      }
      setProgress({ done: ++doneCount, total: flatTasks.length, errors: errorCount })
    })

    setFinalSummary(
      errorCount === 0
        ? `✓ ${flatTasks.length} archivos subidos correctamente`
        : `Subidos ${flatTasks.length - errorCount} de ${flatTasks.length}. Errores: ${errorCount}`
    )
    setUploading(false)
    router.refresh()
  }

  function reset() {
    setPlan(null)
    setUnknownCount(0)
    setStatuses([])
    setProgress({ done: 0, total: 0, errors: 0 })
    setFinalSummary(null)
  }

  // ── Render ──────────────────────────────────────────────────

  const pendingTotal = plan?.reduce((acc, p) => acc + p.files.length, 0) ?? 0

  return (
    <div className="rounded-2xl border border-primary-200 dark:border-primary-800/50 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-500" />
        <h3 className="text-sm font-bold text-primary-700 dark:text-primary-300">
          Carga masiva por carpeta
        </h3>
      </div>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        {tipo === 'mixed' ? (
          <>
            Arrastrá una carpeta que mezcle audios, PDFs y videos. Cada
            archivo se categoriza por extensión automáticamente. Estructura
            sugerida: carpetas de capítulo tipo{' '}
            <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1">cap 1</code>
            ,{' '}
            <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1">SUPLEMENTO AIA</code>
            {' '}con los archivos adentro.
          </>
        ) : (
          <>
            Arrastrá una carpeta con sub-carpetas tipo{' '}
            <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1">cap 1 {tipo}</code>
            ,{' '}
            <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1">SUPLEMENTO AIA</code>{' '}
            y sub-archivos{' '}
            <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1">
              cap-01-mod-01.{tipo === 'pdf' ? 'pdf' : tipo === 'audio' ? 'mp3' : 'mp4'}
            </code>
            . Los módulos se ordenan por nombre, los capítulos por número.
          </>
        )}
      </p>

      {/* Idle / drop zone */}
      {!plan && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400 hover:bg-primary-500/5'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            // @ts-expect-error — webkitdirectory is not in TS types but widely supported
            webkitdirectory=""
            directory=""
            onChange={handleChange}
            className="hidden"
          />
          <HeaderIcon
            className={cn(
              'mx-auto mb-2 h-8 w-8',
              isDragging
                ? 'text-primary-500'
                : 'text-neutral-400 dark:text-neutral-500'
            )}
          />
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            {isDragging ? 'Soltá la carpeta acá' : 'Arrastrá o elegí una carpeta'}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Estructura esperada: carpeta raíz → carpetas de capítulo → archivos
          </p>
        </div>
      )}

      {/* Preview */}
      {plan && !uploading && finalSummary === null && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Detecté{' '}
              <span className="text-primary-600 dark:text-primary-400">
                {plan.length}
              </span>{' '}
              capítulo{plan.length === 1 ? '' : 's'} y{' '}
              <span className="text-primary-600 dark:text-primary-400">
                {pendingTotal}
              </span>{' '}
              archivo{pendingTotal === 1 ? '' : 's'}
              {unknownCount > 0 && (
                <span className="ml-2 text-xs text-warning-600 dark:text-warning-400">
                  ({unknownCount} ignorado{unknownCount === 1 ? '' : 's'})
                </span>
              )}
            </p>
            <button
              onClick={reset}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title="Descartar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Debug panel — shows when nothing matched so user can see
              exactly what paths the parser saw and why they didn't match. */}
          {plan.length === 0 && unknownPaths.length > 0 && (
            <details className="mb-3 rounded-xl border border-warning-300 dark:border-warning-700 bg-warning-50 dark:bg-warning-900/20 text-xs">
              <summary className="cursor-pointer px-3 py-2 font-semibold text-warning-700 dark:text-warning-300">
                No se detectó ningún capítulo — click para ver los paths que
                recibí
              </summary>
              <div className="px-3 pb-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 max-h-48 overflow-y-auto">
                {unknownPaths.slice(0, 20).map((p, i) => (
                  <div key={i} className="truncate">{p}</div>
                ))}
                {unknownPaths.length > 20 && (
                  <div className="mt-1 text-neutral-500">
                    … y {unknownPaths.length - 20} más
                  </div>
                )}
                <p className="mt-2 font-sans text-neutral-500 dark:text-neutral-400">
                  Esperaba carpetas tipo <code>cap 1 audio</code>,{' '}
                  <code>cap-02</code>, <code>SUPLEMENTO AIA</code>,{' '}
                  <code>SUPLEMENTO CIRCULAR E</code>. Si los paths no tienen
                  esa estructura, renombrá las carpetas o avisá qué patrón usás.
                </p>
              </div>
            </details>
          )}

          <div className="mb-4 max-h-80 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            {plan.map((ch) => (
              <details key={ch.numero} className="group border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 list-none">
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400 transition-transform group-open:rotate-90" />
                  <Folder className="h-4 w-4 text-primary-500 shrink-0" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Cap. {ch.numero} — {ch.nombre}
                  </span>
                  <span
                    className={cn(
                      'ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      ch.existsId
                        ? 'bg-success-500/10 text-success-600 dark:text-success-400'
                        : 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                    )}
                  >
                    {ch.existsId ? 'existente' : 'nuevo'}
                  </span>
                  <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {ch.files.length}
                  </span>
                </summary>
                <div className="pb-2">
                  {ch.files.map((f, i) => {
                    const FileTipoIcon = TIPO_ICON[f.tipo]
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-10 py-1 text-xs"
                      >
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0',
                            TIPO_ACCENT[f.tipo]
                          )}
                        >
                          <FileTipoIcon className="h-2.5 w-2.5" />
                          {TIPO_LABEL[f.tipo]}
                        </span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                          {f.suggestedTitle}
                        </span>
                        <span className="text-neutral-400 dark:text-neutral-500 font-mono truncate">
                          {f.file.name}
                        </span>
                        <span className="ml-auto text-neutral-400 tabular-nums shrink-0">
                          {(f.file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    )
                  })}
                </div>
              </details>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={reset}
              className="rounded-xl px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={confirmUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-500 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              Subir {pendingTotal} archivo{pendingTotal === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}

      {/* Uploading progress */}
      {uploading && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Subiendo {progress.done} de {progress.total}...
              {progress.errors > 0 && (
                <span className="ml-2 text-xs text-danger-600 dark:text-danger-400">
                  ({progress.errors} error{progress.errors === 1 ? '' : 'es'})
                </span>
              )}
            </p>
          </div>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{
                width: progress.total
                  ? `${Math.round((progress.done / progress.total) * 100)}%`
                  : '0%',
              }}
            />
          </div>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs">
            {statuses.map((s, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5',
                  i !== 0 && 'border-t border-neutral-100 dark:border-neutral-800'
                )}
              >
                {s.status === 'done' && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-500 shrink-0" />
                )}
                {s.status === 'error' && (
                  <AlertCircle className="h-3.5 w-3.5 text-danger-500 shrink-0" />
                )}
                {s.status === 'uploading' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500 shrink-0" />
                )}
                {s.status === 'pending' && (
                  <Play className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-700 shrink-0" />
                )}
                <span className="truncate text-neutral-700 dark:text-neutral-300 font-mono">
                  {s.file}
                </span>
                {s.error && (
                  <span className="ml-auto truncate text-danger-600 dark:text-danger-400">
                    {s.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final summary */}
      {finalSummary && !uploading && (
        <div
          className={cn(
            'rounded-xl p-4 text-sm font-medium',
            progress.errors === 0
              ? 'bg-success-500/10 text-success-700 dark:text-success-300'
              : 'bg-warning-500/10 text-warning-700 dark:text-warning-300'
          )}
        >
          {finalSummary}
          <button
            onClick={reset}
            className="ml-3 text-xs underline cursor-pointer"
          >
            Subir otra carpeta
          </button>
        </div>
      )}
    </div>
  )
}

// ── Utility: walk a FileSystemEntry tree and collect {file, path} pairs ─

async function walkEntry(
  entry: FileSystemEntry,
  pathPrefix: string
): Promise<FileWithPath[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    return new Promise((resolve) => {
      fileEntry.file((f) => {
        const finalPath = pathPrefix ? `${pathPrefix}/${f.name}` : f.name
        resolve([{ file: f, path: finalPath }])
      })
    })
  }
  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const reader = dirEntry.createReader()
    const out: FileWithPath[] = []
    const newPrefix = pathPrefix
      ? `${pathPrefix}/${entry.name}`
      : entry.name
    // readEntries returns batches; keep reading until empty
    async function readBatch(): Promise<void> {
      const entries = await new Promise<FileSystemEntry[]>((res) =>
        reader.readEntries((arr) => res(arr))
      )
      if (entries.length === 0) return
      for (const e of entries) {
        const nested = await walkEntry(e, newPrefix)
        out.push(...nested)
      }
      await readBatch()
    }
    await readBatch()
    return out
  }
  return []
}
