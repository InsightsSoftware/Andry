import { Users, CreditCard, BookOpen, HelpCircle } from 'lucide-react'

export const metadata = { title: 'Admin - Métricas' }

export default function AdminDashboardPage() {
  // TODO: Fetch real metrics from Supabase
  const metrics = [
    { label: 'Usuarios Totales', value: '0', icon: Users, color: 'primary' },
    { label: 'Pagos del Mes', value: '$0', icon: CreditCard, color: 'success' },
    { label: 'Cursos Activos', value: '0', icon: BookOpen, color: 'accent' },
    { label: 'Preguntas Totales', value: '0', icon: HelpCircle, color: 'primary' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Panel de Administración
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <m.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{m.label}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
