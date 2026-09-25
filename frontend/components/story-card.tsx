import Link from 'next/link';
import type { Story } from '@/types';
import { TrendingScore } from '@/components/trending-score';
import { SourceBadges } from '@/components/source-badges';
import { formatRelativeTime } from '@/lib/format';

export function StoryCard({ story, compact = false }: { story: Story; compact?: boolean }) {
  return (
    <Link
      href={`/story/${story.id}`}
      className="group flex flex-col border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {story.categoryLabel}
        </span>
        {story.isBreaking && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
            Breaking
          </span>
        )}
      </div>

      <h3
        className={
          compact
            ? 'mb-2 font-serif text-base font-semibold leading-snug tracking-tight'
            : 'mb-2 font-serif text-lg font-semibold leading-snug tracking-tight'
        }
      >
        <span className="bg-gradient-to-r from-foreground to-foreground bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
          {story.title}
        </span>
      </h3>

      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
        {story.summary}
      </p>

      <div className="mt-auto space-y-3">
        <SourceBadges sources={story.sources} maxDisplay={4} />

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{story.sourceCount} sources</span>
            <span>·</span>
            <span>{formatRelativeTime(story.publishedAt)}</span>
          </div>
          <TrendingScore score={story.trendingScore} />
        </div>
      </div>
    </Link>
  );
}
