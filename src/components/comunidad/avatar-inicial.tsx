/**
 * Deterministic initials-avatar: same name → same color every time.
 * Gives a sense of presence without needing actual photo uploads.
 */

const COLORS = [
  { bg: 'bg-purple-500/20', text: 'text-purple-400', ring: 'ring-purple-500/30' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  { bg: 'bg-sky-500/20', text: 'text-sky-400', ring: 'ring-sky-500/30' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400', ring: 'ring-pink-500/30' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  { bg: 'bg-teal-500/20', text: 'text-teal-400', ring: 'ring-teal-500/30' },
  { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500/30' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-400', ring: 'ring-indigo-500/30' },
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface AvatarInicialProps {
  nombre: string | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  ring?: boolean
  className?: string
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function AvatarInicial({
  nombre,
  size = 'sm',
  ring = false,
  className = '',
}: AvatarInicialProps) {
  const name = nombre?.trim() || 'Usuario'
  const initials = getInitials(name)
  const color = COLORS[hashString(name) % COLORS.length]

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${sizeMap[size]} ${color.bg} ${color.text} ${
        ring ? `ring-2 ${color.ring}` : ''
      } ${className}`}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  )
}
