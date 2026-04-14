import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ContratistasPro - Prepárate para tu Licencia de Contratista',
    template: '%s | ContratistasPro',
  },
  description:
    'Plataforma de estudio en español para contratistas hispanos en Florida. Prepárate para tu examen de licencia con audiolibros, PDF interactivo, banco de preguntas y asistente IA.',
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.className} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
