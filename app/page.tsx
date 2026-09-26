import Link from 'next/link';
import {
  getTrendingStories,
  getStoriesByCategory,
  getCategories,
  getTickerHeadlines,
} from '@/services/data';
import { HeadlineTicker } from '@/components/headline-ticker';
import { HeroStory } from '@/components/hero-story';
import { StoryCard } from '@/components/story-card';
import { StoryCarousel } from '@/components/story-carousel';
import { CategorySection } from '@/components/category-section';
import { formatFullDate, formatTime, getMinutesAgo } from '@/lib/format';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/types';

export default async function HomePage() {
  const trending = await getTrendingStories();
  const tickerHeadlines = await getTickerHeadlines();
  const topStory = trending[0];
  const secondaryStories = trending.slice(1, 5);
  const carouselStories = trending.slice(0, 8);
  const cats = getCategories();

  const featuredCategories = ['politics', 'technology', 'science', 'business', 'world', 'health', 'entertainment', 'sports'];

  const categoryStories = await Promise.all(
    featuredCategories.map(async (cat) => ({
      category: cat,
      stories: await getStoriesByCategory(cat as any, 3),
    }))
  );

  return (
    <div>
      <HeadlineTicker headlines={tickerHeadlines} />

      <div className="mx-auto max-w-7xl px-4">
        <div className="py-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Media Intelligence
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-5xl">
            What the world is talking about right now.
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <time>{formatFullDate()}</time>
            <span>·</span>
            <span>{formatTime()}</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-600" />
              Updated {getMinutesAgo(topStory.updatedAt)} min ago
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HeroStory story={topStory} rank={1} />
          </div>
          <div className="flex flex-col gap-4">
            {secondaryStories.map((story, i) => (
              <StoryCard key={story.id} story={story} compact />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <StoryCarousel
          items={carouselStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
          title="Trending Now"
          href="/trending"
        />
      </div>

      {categoryStories.map(({ category, stories }) =>
        stories.length > 0 ? (
          <div key={category} className="mx-auto max-w-7xl px-4">
            <CategorySection
              title={cats.find((c: Category) => c.id === category)?.label ?? category}
              stories={stories}
              href={`/${cats.find((c: Category) => c.id === category)?.slug ?? category}`}
            />
          </div>
        ) : null
      )}

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="border border-border bg-card p-8 text-center">
          <h2 className="mb-2 font-serif text-2xl font-bold tracking-tight">
            Explore by Category
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Dive into specific topics and see how different sources cover them.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {cats.map((c: Category) => (
              <Link
                key={c.id}
                href={`/${c.slug}`}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {c.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
