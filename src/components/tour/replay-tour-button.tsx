'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { DASHBOARD_TOUR_STORAGE_KEY } from './dashboard-tour'

export function ReplayTourButton() {
  const router = useRouter()

  const replay = () => {
    try {
      localStorage.removeItem(DASHBOARD_TOUR_STORAGE_KEY)
    } catch {
      // ignore
    }
    router.push('/panel?tour=1')
  }

  return (
    <button
      onClick={replay}
      className="inline-flex items-center gap-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-sm font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
    >
      <Sparkles className="h-4 w-4" />
      Ver tour de nuevo
    </button>
  )
}
