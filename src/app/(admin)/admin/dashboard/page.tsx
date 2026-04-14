import {
  Users,
  CreditCard,
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
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      label: 'Suscripciones Activas',
      value: metrics.activeSubscriptions.toString(),
      icon: UserCheck,
      color: 'text-success-600 dark:text-success-400',
      bg: 'bg-success-50 dark:bg-success-900/20',
    },
    {
      label: 'Nuevos (7 días)',
      value: metrics.recentSignups.toString(),
      icon: UserPlus,
      color: 'text-accent-600 dark:text-accent-400',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
    },
    {
      label: 'Ingresos del Mes',
      value: `$${metrics.monthlyRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-success-600 dark:text-success-400',
      bg: 'bg-success-50 dark:bg-success-900/20',
    },
    {
      label: 'Cursos Activos',
      value: metrics.activeCourses.toString(),
      icon: BookOpen,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      label: 'Preguntas Totales',
      value: metrics.totalQuestions.toString(),
      icon: HelpCircle,
      color: 'text-warning-600 dark:text-warning-400',
      bg: 'bg-warning-50 dark:bg-warning-900/20',
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Panel de Administración
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}
            >
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {m.label}
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
