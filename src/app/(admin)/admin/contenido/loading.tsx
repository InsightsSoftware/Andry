import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function AdminContentLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
