'use client';

import Link from 'next/link';

export interface TickerHeadline {
  label: string;
  text: string;
  href: string;
}

export function HeadlineTicker({
  headlines = [],
}: {
  headlines?: TickerHeadline[];
}) {
  // Hide the entire ticker when there are no headlines to avoid layout shift.
  if (headlines.length === 0) return null;

  // Duplicate the list so the CSS translateX(-50%) creates a seamless loop.
  const doubled = [...headlines, ...headlines];

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl overflow-hidden px-4">
        <div className="flex items-center gap-4 py-2">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-600" />
            Live
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="ticker-track flex gap-8 whitespace-nowrap">
              {doubled.map((h, i) => (
                <Link
                  key={i}
                  href={h.href}
                  className="flex items-center gap-2 text-sm transition-colors hover:text-foreground/70"
                >
                  <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                    {h.label}
                  </span>
                  <span className="text-foreground">{h.text}</span>
                  <span className="text-border">/</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
