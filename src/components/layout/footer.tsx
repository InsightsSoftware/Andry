import Image from 'next/image'
import Link from 'next/link'
import { Phone, Mail } from 'lucide-react'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z"/>
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/5 bg-primary-700 dark:bg-primary-900 py-10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Main row */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Left — logo + socials */}
          <div className="flex flex-col gap-5">
            {/* Dark mode logo (gold) */}
            <Image
              src="/logo.png"
              alt="Y Exam Prep"
              width={600}
              height={600}
              className="hidden dark:block h-24 w-auto"
            />
            {/* Light mode logo (purple) */}
            <Image
              src="/logo-light.png"
              alt="Y Exam Prep"
              width={600}
              height={600}
              className="block dark:hidden h-24 w-auto"
            />

            {/* Social icons */}
            <div className="flex items-center gap-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </Link>
              <Link
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="TikTok"
              >
                <TikTokIcon />
              </Link>
            </div>
          </div>

          {/* Right — contact */}
          <div className="flex flex-col gap-3">
            <p className="font-bold text-white text-base">Contáctanos</p>
            <a
              href="tel:3862862486"
              className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Phone className="h-4 w-4 shrink-0" />
              (386) 286-2486
            </a>
            <a
              href="mailto:info@yexamprep.com"
              className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Mail className="h-4 w-4 shrink-0" />
              info@yexamprep.com
            </a>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-8 border-t border-white/10 pt-5 text-center">
          <p className="text-xs text-white/50">
            &copy; Copyright {new Date().getFullYear()} Y Exam Prep. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
