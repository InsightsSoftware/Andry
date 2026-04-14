import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function AdminQuestionsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-52" />
      <div>
        <Skeleton className="mb-3 h-6 w-44" />
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
          <Skeleton className="mb-3 h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-6 w-52" />
        <div className="space-y-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}
