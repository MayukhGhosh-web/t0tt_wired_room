import Link from 'next/link';
import type { Story } from '@/types';
import { TrendingScore } from '@/components/trending-score';
import { SourceBadges } from '@/components/source-badges';
import { formatRelativeTime } from '@/lib/format';
import { getUnsplashImageForStory } from '@/lib/unsplash';
import { Flame } from 'lucide-react';

export async function StoryCard({ story, compact = false, rank, totalRank = 500 }: { story: Story; compact?: boolean; rank?: number; totalRank?: number }) {
  const getGradient = (score: number) => {
    if (score >= 85) return 'bg-gradient-to-br from-rose-500 to-purple-600';
    if (score >= 70) return 'bg-gradient-to-br from-orange-400 to-red-500';
    if (score >= 40) return 'bg-gradient-to-br from-amber-300 to-orange-400';
    return 'bg-gradient-to-br from-emerald-400 to-cyan-500';
  };

  const thumbnail = story.thumbnail || await getUnsplashImageForStory(story);

  return (
    <Link
      href={`/story/${story.id}`}
      className="group flex flex-col border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm relative overflow-hidden"
    >
      {thumbnail && (
        <div className="mb-3 w-full h-32 md:h-40 overflow-hidden rounded-sm relative">
           <img src={thumbnail} alt="" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
           <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        </div>
      )}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-white ${getGradient(story.trendingScore)} shadow-sm`} title={`Rank #${rank} out of ${totalRank} in this category`}>
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-bold">#{rank}/{totalRank}</span>
            </div>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {story.categoryLabel}
          </span>
        </div>
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
