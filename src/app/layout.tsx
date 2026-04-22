import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// Hardcoded production URL used for Open Graph / canonical when the
// server isn't sure of its own origin. Matches NEXT_PUBLIC_APP_URL.
const SITE_URL = 'https://andry.onrender.com'
const SITE_NAME = 'Y Exam Prep'
const DEFAULT_TITLE =
  'Y Exam Prep — Preparate para tu Licencia de Contratista en Florida'
const DEFAULT_DESCRIPTION =
  'Plataforma de estudio en español para contratistas hispanos en Florida. PDF interactivo, audiolibros, banco de preguntas, simulacro de examen y asistente IA. Pagá una sola vez, sin suscripciones.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Y Exam Prep' }],
  generator: 'Next.js',
  keywords: [
    'licencia contratista Florida',
    'examen contratista español',
    'preparación examen licencia',
    'contratista hispano Florida',
    'curso contratista en español',
    'business and finance exam Florida',
    'electrical contractor exam',
    'plumbing contractor exam',
    'Lien Law Florida',
  ],
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Y Exam Prep — Preparate para tu Licencia de Contratista en Florida',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050507',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.className} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col mesh-bg">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
