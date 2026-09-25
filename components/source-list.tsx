import Link from 'next/link';
import type { Story, StorySource } from '@/types';
import { formatRelativeTime } from '@/lib/format';
import { ExternalLink } from 'lucide-react';

export function SourceList({ sources }: { sources: StorySource[] }) {
  return (
    <div className="space-y-3">
      {sources.map((src, i) => (
        <a
          key={`${src.sourceId}-${i}`}
          href={src.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 border border-border p-4 transition-all hover:border-foreground/30 hover:bg-accent/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border bg-background font-serif text-sm font-bold">
            {src.sourceName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-semibold">{src.sourceName}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(src.publishedAt)}
              </span>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground group-hover:text-foreground">
              {src.articleHeadline}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      ))}
    </div>
  );
}

export function SourceDistribution({ stories }: { stories: Story[] }) {
  const sourceMap = new Map<string, number>();
  stories.forEach((s) => {
    s.sources.forEach((src) => {
      sourceMap.set(src.sourceName, (sourceMap.get(src.sourceName) ?? 0) + 1);
    });
  });

  const sorted = Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div className="space-y-2">
      {sorted.slice(0, 10).map(([name, count]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs font-medium">{name}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-sm bg-muted">
            <div
              className="h-full bg-foreground/80"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}
