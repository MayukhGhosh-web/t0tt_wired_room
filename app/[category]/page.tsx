import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoriesByCategory, getCategories, getCategoryLabel } from '@/services/data';
import { StoryCard } from '@/components/story-card';
import { SourceDistribution } from '@/components/source-list';
import { EmptyState } from '@/components/states';
import type { CategoryId, Category } from '@/types';
import { cn } from '@/lib/utils';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cats = getCategories();
  const cat = cats.find((c: Category) => c.slug === params.category);
  if (!cat) notFound();

  const pageParam = typeof searchParams.page === 'string' ? searchParams.page : '1';
  const page = parseInt(pageParam, 10) || 1;
  const pageSize = 10;

  const stories = await getStoriesByCategory(cat.id as CategoryId);

  const allStories = [...stories].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 50);
  
  const totalPages = Math.ceil(allStories.length / pageSize);
  const maxPages = Math.min(totalPages, 5); // max upto 5 pages for all 50
  const safePage = Math.max(1, Math.min(page, maxPages || 1));
  
  const startIndex = (safePage - 1) * pageSize;
  const paginatedStories = allStories.slice(startIndex, startIndex + pageSize);

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
          {stories.length} trending stories · {stories.reduce((acc, s) => acc + s.sourceCount, 0)} sources
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
          {paginatedStories.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Top Trending Stories (Page {safePage} of {maxPages})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedStories.map((s, index) => (
                  <StoryCard key={s.id} story={s} rank={startIndex + index + 1} />
                ))}
              </div>
              
              {maxPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {[...Array(maxPages)].map((_, i) => {
                    const p = i + 1;
                    return (
                      <Link
                        key={p}
                        href={`/${cat.slug}?page=${p}`}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                          p === safePage
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>
              )}
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
