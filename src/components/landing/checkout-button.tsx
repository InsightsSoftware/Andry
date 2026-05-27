'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
  planKey: 'basico' | 'premium'
  label: string
  className?: string
}

export function CheckoutButton({ planKey, label, className = '' }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset loading when user navigates back from Stripe (bfcache restore)
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        setLoading(false)
        setError('')
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  async function handleClick() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al procesar pago')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
        ) : (
          <>{label}<ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center max-w-[200px]">{error}</p>
      )}
    </div>
  )
}
