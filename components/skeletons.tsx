import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function SkeletonCard() {
  return (
    <div className="flex flex-col border border-border bg-card p-4">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-2 h-5 w-full" />
      <Skeleton className="mb-1 h-5 w-3/4" />
      <Skeleton className="mb-4 h-3 w-full" />
      <Skeleton className="mb-4 h-3 w-5/6" />
      <div className="mt-auto space-y-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="flex flex-col border border-border bg-card p-6 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-sm" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className="mb-4 h-8 w-full" />
      <Skeleton className="mb-2 h-8 w-3/4" />
      <Skeleton className="mb-6 h-4 w-full" />
      <Skeleton className="mb-6 h-4 w-5/6" />
      <Skeleton className="mb-6 h-4 w-4/5" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-10" />
      </div>
      <div className="mt-6 flex justify-between border-t border-border pt-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

export function SkeletonEntitySidebar() {
  return (
    <div className="border border-border bg-card p-5">
      <Skeleton className="mb-4 h-6 w-24" />
      <div className="space-y-5">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-2 h-3 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCarousel() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-[300px] shrink-0 md:w-[340px]">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
