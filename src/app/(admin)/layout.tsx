import { AdminSidebar, AdminMobileNav } from '@/components/layout/admin-sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <AdminMobileNav />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
