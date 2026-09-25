import { notFound } from 'next/navigation';
import { getStoriesByCategory, getCategories, getCategoryLabel } from '@/services/data';
import { StoryCard } from '@/components/story-card';
import { TrendingScore } from '@/components/trending-score';
import { SourceDistribution } from '@/components/source-list';
import { EmptyState } from '@/components/states';
import type { CategoryId } from '@/types';

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cats = getCategories();
  const cat = cats.find((c) => c.slug === params.category);
  if (!cat) notFound();

  const stories = await getStoriesByCategory(cat.id as CategoryId);

  const topStories = [...stories]
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 3);
  const latestStories = [...stories].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 border-b border-border pb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Category
        </div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-4xl">
          {cat.label}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {stories.length} stories · {stories.reduce((acc, s) => acc + s.sourceCount, 0)} sources
        </p>
      </div>

      {stories.length === 0 ? (
        <EmptyState
          title="No stories in this category"
          message="Check back later for updates in this category."
          icon="empty"
        />
      ) : (
        <>
          {topStories.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Top Stories
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topStories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            </section>
          )}

          {latestStories.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Latest Stories
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {latestStories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            </section>
          )}

          {stories.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Source Distribution
              </h2>
              <div className="border border-border bg-card p-5">
                <SourceDistribution stories={stories} />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
