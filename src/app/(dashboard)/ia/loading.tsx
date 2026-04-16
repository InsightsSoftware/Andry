import { Skeleton } from '@/components/ui/skeleton'

export default function IALoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="flex justify-start">
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-24 w-2/3 rounded-2xl" />
        </div>
      </div>
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}
