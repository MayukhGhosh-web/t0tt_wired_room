'use client';

import { useMemo, useState } from 'react';
import type { Story } from '@/types';
import { StoryCard } from '@/components/story-card';
import { FilterBar, type FilterState } from '@/components/filter-bar';
import { EmptyState } from '@/components/states';

const trendingMinScores: Record<string, number> = {
  all: 0,
  rising: 60,
  high: 75,
  viral: 85,
};

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 3600_000;
}

function matchesTime(story: Story, time: string): boolean {
  if (time === 'all') return true;
  const h = hoursSince(story.publishedAt);
  if (time === 'last-hour') return h <= 1;
  if (time === 'today') return h <= 24;
  if (time === 'this-week') return h <= 24 * 7;
  return true;
}

export function TrendingView({ stories }: { stories: Story[] }) {
  const [filters, setFilters] = useState<FilterState>({
    time: 'all',
    trendingLevel: 'all',
  });

  const filtered = useMemo(() => {
    const minScore = trendingMinScores[filters.trendingLevel] ?? 0;
    return stories.filter(
      (s) => s.trendingScore >= minScore && matchesTime(s, filters.time)
    );
  }, [stories, filters]);

  return (
    <div>
      <div className="mb-6">
        <FilterBar onFilterChange={setFilters} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No trending stories"
          message="No stories match the current filters. Try clearing your filters."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'story' : 'stories'} ·
            sorted by trending score
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
