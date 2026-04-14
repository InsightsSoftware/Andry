import {
  Users,
  BookOpen,
  HelpCircle,
  TrendingUp,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { getAdminMetrics } from '@/actions/admin'

export const metadata = { title: 'Admin - Métricas' }

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics()

  const cards = [
    {
      label: 'Usuarios Totales',
      value: metrics.totalUsers.toString(),
      icon: Users,
      color: 'text-primary-400',
      glow: 'from-primary-500/10',
    },
    {
      label: 'Suscripciones Activas',
      value: metrics.activeSubscriptions.toString(),
      icon: UserCheck,
      color: 'text-emerald-400',
      glow: 'from-emerald-500/10',
    },
    {
      label: 'Nuevos (7 días)',
      value: metrics.recentSignups.toString(),
      icon: UserPlus,
      color: 'text-amber-400',
      glow: 'from-amber-500/10',
    },
    {
      label: 'Ingresos del Mes',
      value: `$${metrics.monthlyRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      glow: 'from-emerald-500/10',
    },
    {
      label: 'Cursos Activos',
      value: metrics.activeCourses.toString(),
      icon: BookOpen,
      color: 'text-primary-400',
      glow: 'from-primary-500/10',
    },
    {
      label: 'Preguntas Totales',
      value: metrics.totalQuestions.toString(),
      icon: HelpCircle,
      color: 'text-amber-400',
      glow: 'from-amber-500/10',
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        Panel de Administración
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((m) => (
          <div
            key={m.label}
            className="relative rounded-2xl p-5 glass-card overflow-hidden transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${m.glow} to-transparent pointer-events-none`} />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <p className="text-sm text-neutral-400">
                {m.label}
              </p>
              <p className="text-2xl font-bold text-white">
                {m.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
