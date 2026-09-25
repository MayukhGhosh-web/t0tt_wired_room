import Link from 'next/link';
import type { Entity } from '@/types';
import { cn } from '@/lib/utils';

export function EntityGraph({
  center,
  related,
}: {
  center: Entity;
  related: Entity[];
}) {
  return (
    <div className="border border-border bg-card p-6">
      <h3 className="mb-6 font-serif text-lg font-bold tracking-tight">
        Relationships
      </h3>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border-2 border-foreground bg-background px-4 py-2">
          <span className="font-serif text-sm font-bold">{center.name}</span>
        </div>
        {related.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="h-6 w-px bg-border" />
            <div className="flex flex-col gap-2">
              {related.map((e) => (
                <div key={e.id} className="flex flex-col items-center">
                  <div className="h-4 w-px bg-border" />
                  <Link
                    href={`/entity/${e.id}`}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 transition-colors hover:border-foreground/30 hover:bg-accent"
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold text-muted-foreground'
                      )}
                    >
                      {e.type.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">{e.name}</span>
                    {e.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        · {e.subtitle}
                      </span>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
        {related.length === 0 && (
          <p className="text-sm text-muted-foreground">No related entities.</p>
        )}
      </div>
    </div>
  );
}
