import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Story } from '@/types';
import { TrendingScore } from '@/components/trending-score';
import { SourceBadges } from '@/components/source-badges';
import { formatRelativeTime } from '@/lib/format';
import { getUnsplashImageForStory } from '@/lib/unsplash';

export async function HeroStory({ story, rank = 1 }: { story: Story; rank?: number }) {
  const thumbnail = story.thumbnail || await getUnsplashImageForStory(story);

  return (
    <article className="group relative flex flex-col border border-border bg-card p-6 transition-all hover:border-foreground/30 md:p-8">
      {thumbnail && (
        <div className="mb-6 w-full h-64 md:h-80 overflow-hidden rounded-sm relative">
           <img src={thumbnail} alt="" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
           <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        </div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-mono text-sm font-bold text-primary-foreground">
          {rank}
        </span>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Trending #{rank}
          </div>
          <div className="text-xs text-muted-foreground">
            {story.categoryLabel}
          </div>
        </div>
        {story.isBreaking && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
            Breaking
          </span>
        )}
      </div>

      <h1 className="mb-4 font-serif text-2xl font-bold leading-tight tracking-tight md:text-4xl">
        <Link href={`/story/${story.id}`} className="bg-gradient-to-r from-foreground to-foreground bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_2px]">
          {story.title}
        </Link>
      </h1>

      <p className="mb-6 text-base leading-relaxed text-muted-foreground md:text-lg">
        {story.summary}
      </p>

      <div className="mb-6">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          This story is covered by
        </div>
        <SourceBadges sources={story.sources} maxDisplay={6} />
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{story.sourceCount} sources</span>
          <span>·</span>
          <span>Updated {formatRelativeTime(story.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-4">
          <TrendingScore score={story.trendingScore} size="lg" />
          <Link
            href={`/story/${story.id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Read Story
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
