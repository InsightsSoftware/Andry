'use client'

import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'

/**
 * A tour step points to a DOM element (via CSS selector) and shows a
 * tooltip near it. If `target` is null, the step is a full-screen
 * centered welcome/ending card.
 */
export interface TourStep {
  target: string | null
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
}

interface TourGuideProps {
  steps: TourStep[]
  /** Key used in localStorage. Change it to reset for all users. */
  storageKey: string
  /** Optional: force the tour open regardless of storageKey. */
  force?: boolean
  /** Called when the tour finishes or is skipped. */
  onDismiss?: () => void
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const SPOTLIGHT_PADDING = 8
const TOOLTIP_GAP = 16
const TOOLTIP_WIDTH = 340

export function TourGuide({
  steps,
  storageKey,
  force = false,
  onDismiss,
}: TourGuideProps) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<TargetRect | null>(null)

  // Decide whether to open the tour on mount
  useEffect(() => {
    if (force) {
      setOpen(true)
      setIndex(0)
      return
    }
    try {
      const seen = localStorage.getItem(storageKey)
      if (!seen) {
        // Delay slightly so the page layout settles before measuring
        const t = setTimeout(() => setOpen(true), 600)
        return () => clearTimeout(t)
      }
    } catch {
      // localStorage blocked — just skip the tour silently
    }
  }, [storageKey, force])

  const currentStep = steps[index]
  const isLast = index === steps.length - 1
  const isFirst = index === 0

  // Measure the target element each time the step changes or layout shifts
  useLayoutEffect(() => {
    if (!open || !currentStep) {
      setRect(null)
      return
    }
    if (!currentStep.target) {
      setRect(null)
      return
    }

    const update = () => {
      const el = document.querySelector(currentStep.target as string)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })

      // Scroll the target into view if it's off-screen
      if (r.top < 60 || r.bottom > window.innerHeight - 60) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    update()

    const resize = () => update()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', resize, true)
    // A tick later, remeasure after smooth scrolling finishes
    const t = setTimeout(update, 420)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', resize, true)
      clearTimeout(t)
    }
  }, [open, index, currentStep])

  // Lock body scroll while the tour is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Keyboard navigation
  const next = useCallback(() => {
    if (isLast) {
      dismiss()
    } else {
      setIndex((i) => Math.min(i + 1, steps.length - 1))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLast, steps.length])

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, new Date().toISOString())
    } catch {
      // ignore
    }
    setOpen(false)
    onDismiss?.()
  }, [storageKey, onDismiss])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismiss, next, prev])

  if (!open || !currentStep) return null

  // Compute tooltip position
  const tooltipStyle = getTooltipStyle(rect, currentStep.placement)

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {/* Dark backdrop with a spotlight hole over the target */}
      <svg
        className="pointer-events-auto absolute inset-0 h-full w-full"
        onClick={dismiss}
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - SPOTLIGHT_PADDING}
                y={rect.top - SPOTLIGHT_PADDING}
                width={rect.width + SPOTLIGHT_PADDING * 2}
                height={rect.height + SPOTLIGHT_PADDING * 2}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Glowing outline around the target */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-primary-400/80 shadow-[0_0_40px_10px_rgba(147,51,234,0.4)] transition-all duration-300"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="pointer-events-auto absolute max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={tooltipStyle}
      >
        <div className="w-[340px] max-w-full rounded-2xl border border-primary-400/30 bg-neutral-900 p-5 shadow-2xl shadow-primary-900/50 backdrop-blur-sm">
          {/* Step counter */}
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-400">
              <Sparkles className="h-2.5 w-2.5" />
              Paso {index + 1} de {steps.length}
            </span>
            <button
              onClick={dismiss}
              className="rounded-lg p-1 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
              aria-label="Saltar tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mb-1.5 text-lg font-bold text-white">
            {currentStep.title}
          </h3>
          <p className="mb-4 text-sm text-neutral-300 leading-relaxed">
            {currentStep.body}
          </p>

          {/* Progress dots */}
          <div className="mb-4 flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= index
                    ? 'bg-primary-500'
                    : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={dismiss}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Saltar tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="inline-flex items-center gap-1 rounded-xl border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Atrás
                </button>
              )}
              <button
                onClick={next}
                className="inline-flex items-center gap-1 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-500 transition-colors cursor-pointer"
              >
                {isLast ? 'Listo' : 'Siguiente'}
                {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTooltipStyle(
  rect: TargetRect | null,
  placement: TourStep['placement'] = 'auto'
): React.CSSProperties {
  // No target — center on screen
  if (!rect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768

  // Decide placement automatically if 'auto'
  let side: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
  if (placement === 'auto') {
    const spaceBottom = vh - (rect.top + rect.height)
    const spaceTop = rect.top
    const spaceRight = vw - (rect.left + rect.width)
    const spaceLeft = rect.left

    // Prefer vertical placement unless there's clearly more horizontal room
    if (spaceBottom >= 260) side = 'bottom'
    else if (spaceTop >= 260) side = 'top'
    else if (spaceRight >= TOOLTIP_WIDTH + 40) side = 'right'
    else if (spaceLeft >= TOOLTIP_WIDTH + 40) side = 'left'
    else side = 'bottom' // fallback — will scroll anyway
  } else {
    side = placement
  }

  let top: number
  let left: number

  switch (side) {
    case 'top':
      top = rect.top - TOOLTIP_GAP
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
      // transform translateY(-100%) pushes the tooltip above
      return {
        top,
        left: clamp(left, 16, vw - TOOLTIP_WIDTH - 16),
        transform: 'translateY(-100%)',
      }
    case 'bottom':
      top = rect.top + rect.height + TOOLTIP_GAP
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
      return {
        top,
        left: clamp(left, 16, vw - TOOLTIP_WIDTH - 16),
      }
    case 'left':
      top = rect.top + rect.height / 2
      left = rect.left - TOOLTIP_GAP
      return {
        top,
        left,
        transform: 'translate(-100%, -50%)',
      }
    case 'right':
      top = rect.top + rect.height / 2
      left = rect.left + rect.width + TOOLTIP_GAP
      return {
        top,
        left,
        transform: 'translateY(-50%)',
      }
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
