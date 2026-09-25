export const dynamic = 'force-dynamic';

import { getTrendingStories } from '@/services/data';
import { TrendingView } from '@/components/trending-view';

export const metadata = {
  title: 'Trending — PULSE',
  description: 'The most talked-about stories right now, ranked by trending score.',
};

export default async function TrendingPage() {
  const stories = await getTrendingStories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 border-b border-border pb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Media Intelligence
        </div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-4xl">
          Trending Now
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {stories.length} stories · ranked by score, source count, category and
          recency
        </p>
      </div>

      <TrendingView stories={stories} />
    </div>
  );
}
