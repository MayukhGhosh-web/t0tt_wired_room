import type { StorySource } from '@/types';
import { cn } from '@/lib/utils';

export function SourceBadges({
  sources,
  maxDisplay = 5,
}: {
  sources: StorySource[];
  maxDisplay?: number;
}) {
  const displayed = sources.slice(0, maxDisplay);
  const remaining = sources.length - displayed.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayed.map((src, i) => (
        <span
          key={`${src.sourceId}-${i}`}
          className={cn(
            'inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'
          )}
        >
          {src.sourceName}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-[10px] text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
