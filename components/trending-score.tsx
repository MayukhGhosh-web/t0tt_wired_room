import { cn } from '@/lib/utils';

export function TrendingScore({
  score,
  size = 'sm',
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const level =
    score >= 85 ? 'high' : score >= 70 ? 'medium' : 'normal';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        size === 'lg' && 'gap-2'
      )}
    >
      <span
        className={cn(
          'text-[10px] font-medium uppercase tracking-wider text-muted-foreground',
          size === 'lg' && 'text-xs'
        )}
      >
        Temp
      </span>
      <span
        className={cn(
          'font-mono font-bold tabular-nums',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-2xl',
          level === 'high' && 'text-foreground',
          level === 'medium' && 'text-foreground/80',
          level === 'normal' && 'text-muted-foreground'
        )}
      >
        {score}
      </span>
      {size === 'lg' && (
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 w-1 rounded-full',
                  i < Math.round(score / 10) ? 'bg-foreground' : 'bg-border'
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
