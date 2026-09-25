import { SkeletonGrid } from '@/components/skeletons';

export default function TrendingLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 border-b border-border pb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Media Intelligence
        </div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-4xl">
          Trending Now
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Loading stories...</p>
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}
