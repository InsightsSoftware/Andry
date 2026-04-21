import { Sidebar } from '@/components/layout/sidebar'
import { BottomTabs } from '@/components/layout/bottom-tabs'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* min-w-0 is critical on a flex child: without it, any wide child
          (long heading, image) forces the flex item wider than the
          viewport on mobile. */}
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
      </main>
      <BottomTabs />
    </div>
  )
}
