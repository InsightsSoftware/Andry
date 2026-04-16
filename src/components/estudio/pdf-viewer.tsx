'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const PDFViewerClient = dynamic(
  () =>
    import('./pdf-viewer-client').then((mod) => ({
      default: mod.PDFViewerClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 flex-col items-center justify-center gap-3" style={{ minHeight: '500px' }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Preparando visor de PDF...
        </p>
      </div>
    ),
  }
)

interface PDFViewerProps {
  contenidoId: string
  archivoUrl: string
  initialProgress: number
}

export function PDFViewer(props: PDFViewerProps) {
  return <PDFViewerClient {...props} />
}
